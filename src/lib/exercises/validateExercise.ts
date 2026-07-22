export type RuleType =
  | 'REQUIRE_COMMAND'
  | 'REQUIRE_ENVIRONMENT'
  | 'REQUIRE_ARGUMENT'
  | 'REQUIRE_TEXT'
  | 'REQUIRE_PACKAGE'
  | 'REQUIRE_MATH_STRUCTURE'
  | 'REQUIRE_ORDER'
  | 'REQUIRE_MATCHING_ARGUMENTS'
  | 'FORBID_ALTERNATIVE';

export type RuleScope = 'PREAMBLE' | 'BODY' | 'MATH' | 'FULL_DOCUMENT';

export type ValidationFailureCode =
  | 'MISSING_COMMAND'
  | 'MISSING_ENVIRONMENT'
  | 'WRONG_ARGUMENT'
  | 'MISSING_TEXT'
  | 'WRONG_ORDER'
  | 'FORBIDDEN_ALTERNATIVE';

const UNSUPPORTED_CODE = 'UNSUPPORTED_RULE' as const;
type UnsupportedCode = typeof UNSUPPORTED_CODE;

type RuleEvalCode = ValidationFailureCode | 'OK';

export interface ValidationRule {
  id: string;
  type: RuleType;
  required: boolean;
  scope: RuleScope;
  target?: string;
  expected?: unknown;
  arguments?: unknown;
  normalization?: string[];
  feedback: string;
  orderSensitive?: boolean;
}

export interface FailedRuleInfo {
  id: string;
  code: ValidationFailureCode;
  message: string;
  command?: string;
  argument?: string;
}

export interface UnsupportedRuleInfo {
  id: string;
  type: RuleType;
  required: boolean;
  code: UnsupportedCode;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  matchedRules: string[];
  failedRules: FailedRuleInfo[];
  unsupportedRules: UnsupportedRuleInfo[];
  feedback: string[];
}

interface RuleEvalResult {
  passed: boolean;
  code: RuleEvalCode;
  command?: string;
  argument?: string;
}

const SUPPORTED_TYPES: ReadonlySet<RuleType> = new Set([
  'REQUIRE_COMMAND',
  'REQUIRE_ENVIRONMENT',
  'REQUIRE_ARGUMENT',
  'REQUIRE_TEXT',
  'REQUIRE_PACKAGE',
  'REQUIRE_ORDER',
  'FORBID_ALTERNATIVE',
]);

function isRuleSupported(rule: ValidationRule): boolean {
  return SUPPORTED_TYPES.has(rule.type);
}

function stripComments(latex: string): string {
  return latex.split('\n').map(line => {
    let result = '';
    let i = 0;
    while (i < line.length) {
      if (line[i] === '\\' && i + 1 < line.length && line[i + 1] === '%') {
        result += '%';
        i += 2;
      } else if (line[i] === '%') {
        break;
      } else {
        result += line[i];
        i++;
      }
    }
    return result;
  }).join('\n');
}

function normalizeLatex(latex: string): string {
  let result = latex.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  result = stripComments(result);
  result = result.split('\n').map(line => line.trim()).join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result;
}

function extractScope(normalized: string, scope: RuleScope): string {
  switch (scope) {
    case 'FULL_DOCUMENT':
      return normalized;
    case 'PREAMBLE': {
      const beginIdx = normalized.indexOf('\\begin{document}');
      if (beginIdx === -1) return normalized;
      return normalized.slice(0, beginIdx);
    }
    case 'BODY': {
      const beginIdx = normalized.indexOf('\\begin{document}');
      if (beginIdx === -1) return '';
      const firstEndIdx = normalized.indexOf('\\end{document}');
      if (firstEndIdx !== -1 && firstEndIdx < beginIdx) return '';
      const endIdx = normalized.indexOf('\\end{document}', beginIdx + 1);
      if (endIdx === -1) return '';
      return normalized.slice(
        beginIdx + '\\begin{document}'.length,
        endIdx,
      );
    }
    case 'MATH': {
      const mathParts: string[] = [];
      const patterns = [
        /\$([^$]+)\$/g,
        /\\\(([^)]+)\\\)/g,
        /\\\[([^\]]+)\\\]/g,
      ];
      for (const pattern of patterns) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(normalized)) !== null) {
          mathParts.push(m[1]);
        }
      }
      return mathParts.join(' ');
    }
    default:
      return normalized;
  }
}

function extractFirstArgument(cmd: string, content: string): string | null {
  const escaped = cmd.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
  const pattern = new RegExp(escaped + '\\s*(?:\\[[^\\]]*\\])?\\s*\\{([^}]*)\\}');
  const match = pattern.exec(content);
  return match ? match[1] : null;
}

function findExactCommand(target: string, content: string): boolean {
  if (!target.startsWith('\\')) return content.includes(target);
  const escaped = target
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
  const withBoundary = escaped.replace(
    /\\([a-zA-Z]+)/,
    m => m + '(?![a-zA-Z])',
  ) + '(?![a-zA-Z])';
  return new RegExp(withBoundary).test(content);
}

function checkRequireCommand(rule: ValidationRule, content: string): RuleEvalResult {
  const target = rule.target;
  if (!target) {
    return { passed: false, code: 'MISSING_COMMAND' };
  }
  const found = findExactCommand(target, content);
  return {
    passed: found,
    code: found ? 'OK' : 'MISSING_COMMAND',
    command: target,
  };
}

function checkRequireEnvironment(rule: ValidationRule, fullContent: string): RuleEvalResult {
  const envName = rule.target || '';
  if (!envName) {
    return { passed: false, code: 'MISSING_ENVIRONMENT' };
  }
  const beginTag = `\\begin{${envName}}`;
  const endTag = `\\end{${envName}}`;
  const beginPos = fullContent.indexOf(beginTag);
  const endPos = fullContent.indexOf(endTag);

  if (beginPos === -1) {
    return { passed: false, code: 'MISSING_ENVIRONMENT', command: beginTag };
  }
  if (endPos === -1) {
    return { passed: false, code: 'MISSING_ENVIRONMENT', command: endTag };
  }
  if (endPos < beginPos) {
    return { passed: false, code: 'WRONG_ORDER', command: envName };
  }
  return { passed: true, code: 'OK' };
}

function checkRequireArgument(rule: ValidationRule, content: string): RuleEvalResult {
  const cmd = rule.target;
  const expectedRaw = rule.expected;
  if (!cmd || expectedRaw === undefined || expectedRaw === null) {
    return { passed: false, code: 'WRONG_ARGUMENT' };
  }
  const actual = extractFirstArgument(cmd, content);
  const expected = String(expectedRaw);
  if (actual === null) {
    return { passed: false, code: 'WRONG_ARGUMENT', command: cmd, argument: expected };
  }
  const match = actual.trim() === expected;
  return {
    passed: match,
    code: match ? 'OK' : 'WRONG_ARGUMENT',
    command: cmd,
    argument: expected,
  };
}

function checkRequireText(rule: ValidationRule, content: string): RuleEvalResult {
  const target = (rule.target || '').trim();
  if (target === '') {
    const hasContent = /\S/.test(content);
    return { passed: hasContent, code: hasContent ? 'OK' : 'MISSING_TEXT' };
  }
  const found = content.includes(target);
  return {
    passed: found,
    code: found ? 'OK' : 'MISSING_TEXT',
    argument: target,
  };
}

function checkRequireOrder(rule: ValidationRule, fullContent: string): RuleEvalResult {
  const rawTargets = rule.target || '';
  const targets = rawTargets.split('\u2192').map(s => s.trim()).filter(Boolean);
  if (targets.length < 2) {
    return { passed: true, code: 'OK' };
  }
  let lastPos = -1;
  for (const t of targets) {
    const pos = fullContent.indexOf(t);
    if (pos === -1) {
      return { passed: false, code: 'WRONG_ORDER', command: t };
    }
    if (pos < lastPos) {
      return { passed: false, code: 'WRONG_ORDER', command: t };
    }
    lastPos = pos;
  }
  return { passed: true, code: 'OK' };
}

function checkRequirePackage(rule: ValidationRule, content: string): RuleEvalResult {
  const pkgName = rule.target;
  if (!pkgName) {
    return { passed: false, code: 'MISSING_COMMAND' };
  }
  const usepackageRegex = /\\usepackage(?:\[([^\]]*)\])?\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = usepackageRegex.exec(content)) !== null) {
    const name = match[2].trim();
    if (name !== pkgName) continue;
    const expectedOption = rule.expected as string | undefined;
    if (expectedOption !== undefined) {
      const actualOption = match[1] ? match[1].trim() : null;
      if (actualOption !== expectedOption) {
        return {
          passed: false,
          code: 'WRONG_ARGUMENT',
          command: `\\usepackage[${actualOption ?? ''}]{${name}}`,
          argument: expectedOption,
        };
      }
    }
    return { passed: true, code: 'OK' };
  }
  return { passed: false, code: 'MISSING_COMMAND', command: `\\usepackage{${pkgName}}` };
}

function checkForbidAlternative(rule: ValidationRule, content: string): RuleEvalResult {
  const target = rule.target;
  if (!target) {
    return { passed: true, code: 'OK' };
  }
  const forbidden = content.includes(target);
  if (forbidden) {
    return { passed: false, code: 'FORBIDDEN_ALTERNATIVE', command: target };
  }
  return { passed: true, code: 'OK' };
}

function evaluateRule(rule: ValidationRule, normalizedFull: string): RuleEvalResult {
  const scopeContent = extractScope(normalizedFull, rule.scope);

  switch (rule.type) {
    case 'REQUIRE_COMMAND':
      return checkRequireCommand(rule, scopeContent);
    case 'REQUIRE_ENVIRONMENT':
      return checkRequireEnvironment(rule, normalizedFull);
    case 'REQUIRE_ARGUMENT':
      return checkRequireArgument(rule, scopeContent);
    case 'REQUIRE_TEXT':
      return checkRequireText(rule, scopeContent);
    case 'REQUIRE_PACKAGE':
      return checkRequirePackage(rule, scopeContent);
    case 'REQUIRE_ORDER':
      return checkRequireOrder(rule, normalizedFull);
    case 'FORBID_ALTERNATIVE':
      return checkForbidAlternative(rule, scopeContent);
    default:
      return { passed: false, code: 'MISSING_COMMAND' };
  }
}

export function validateExercise(
  userCode: string,
  rules: ValidationRule[],
): ValidationResult {
  const normalized = normalizeLatex(userCode);
  const matchedRules: string[] = [];
  const failedRules: FailedRuleInfo[] = [];
  const unsupportedRules: UnsupportedRuleInfo[] = [];
  const feedback: string[] = [];

  for (const rule of rules) {
    if (!isRuleSupported(rule)) {
      unsupportedRules.push({
        id: rule.id,
        type: rule.type,
        required: rule.required,
        code: UNSUPPORTED_CODE,
        message: rule.feedback,
      });
      continue;
    }

    const result = evaluateRule(rule, normalized);
    if (result.passed) {
      matchedRules.push(rule.id);
    } else {
      failedRules.push({
        id: rule.id,
        code: result.code as ValidationFailureCode,
        message: rule.feedback,
        command: result.command,
        argument: result.argument,
      });
      feedback.push(rule.feedback);
    }
  }

  const anyRequiredFailed = rules.some(
    r => r.required && failedRules.some(f => f.id === r.id),
  );
  const anyRequiredUnsupported = unsupportedRules.some(r => r.required);

  return {
    valid: !anyRequiredFailed && !anyRequiredUnsupported,
    matchedRules,
    failedRules,
    unsupportedRules,
    feedback,
  };
}
