import { useState } from 'react';

export interface CopyCodeButtonProps {
  code: string;
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const copyDocument = document as unknown as { execCommand(command: string): boolean };
    return copyDocument.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

export async function copyLibraryCode(code: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      return true;
    }
  } catch {
    // Try the synchronous fallback below.
  }
  try {
    return legacyCopy(code);
  } catch {
    return false;
  }
}

export default function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [message, setMessage] = useState('');

  async function handleCopy() {
    const copied = await copyLibraryCode(code);
    setMessage(copied ? 'Código copiado' : 'No se pudo copiar el código');
  }

  return (
    <div className="template-copy-action">
      <button type="button" onClick={handleCopy}>Copiar</button>
      <span role="status" aria-live="polite" aria-atomic="true">{message}</span>
    </div>
  );
}
