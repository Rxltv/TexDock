import { useEffect, useId, useRef, useState, type CSSProperties, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';
import 'katex/dist/katex.min.css';
import type { SafeLatexPreviewResult } from '../../lib/latex/safeLatexPreview';
import type {
  SafeBibliographyEntry,
  SafeCitation,
} from '../../lib/latex/safeBibliographyPreview';
import type { SafeFigurePreview } from '../../lib/latex/safeFigurePreview';
import type { SafeFootnotePreview } from '../../lib/latex/safeFootnotePreview';
import type { SafeMathPreviewBlock } from '../../lib/latex/safeMathPreview';
import type { SafeMathInline } from '../../lib/latex/safeMathPreview';
import type { SafeResolvedReference } from '../../lib/latex/safeReferencePreview';
import type { SafeTablePreview } from '../../lib/latex/safeTablePreview';
import { getStatusMessage } from '../../lib/latex/previewDisplay';
import type { PreviewDisplayKind } from '../../lib/latex/previewDisplay';

export interface SafeLatexPreviewPanelProps {
  result: SafeLatexPreviewResult;
  lastValidResult: SafeLatexPreviewResult | null;
}

function PreviewInlines({ inlines }: { inlines: SafeMathInline[] }) {
  return (
    <>
      {inlines.map((inline, index) => {
        if (inline.kind === 'text') return <span key={index}>{inline.text}</span>;
        if (inline.kind === 'math') {
          return (
            <span
              className="preview-inline-math"
              key={index}
              dangerouslySetInnerHTML={{ __html: inline.html }}
            />
          );
        }
        const children = <PreviewInlines inlines={inline.children} />;
        if (inline.kind === 'strong') return <strong key={index}>{children}</strong>;
        if (inline.kind === 'emphasis') return <em key={index}>{children}</em>;
        return <span className="preview-underline" key={index}>{children}</span>;
      })}
    </>
  );
}

function PreviewBlocks({ blocks }: { blocks: SafeMathPreviewBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p className="preview-paragraph" key={index}>
              <PreviewInlines inlines={block.inlines} />
            </p>
          );
        }
        if (block.kind === 'heading') {
          const content = (
            <>
              {block.number && <span className="preview-heading-number">{block.number} </span>}
              <PreviewInlines inlines={block.inlines} />
            </>
          );
          if (block.level === 1) return <h2 className="preview-document-heading preview-document-heading--section" key={index}>{content}</h2>;
          if (block.level === 2) return <h3 className="preview-document-heading preview-document-heading--subsection" key={index}>{content}</h3>;
          return <h4 className="preview-document-heading preview-document-heading--subsubsection" key={index}>{content}</h4>;
        }
        if (block.kind === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag className={`preview-list preview-list--${block.ordered ? 'ordered' : 'unordered'}`} key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <PreviewBlocks blocks={item.children} />
                </li>
              ))}
            </ListTag>
          );
        }
        if (block.kind === 'formal') {
          return (
            <section className="preview-formal" key={index}>
              <p className="preview-formal-title">{block.title}</p>
              <PreviewBlocks blocks={block.children} />
            </section>
          );
        }
        return (
          <div
            className={`preview-math-block${block.kind === 'equation' ? ' preview-equation' : ''}`}
            key={index}
          >
            <div dangerouslySetInnerHTML={{ __html: block.html }} />
            {block.kind === 'equation' && (
              <span className="preview-equation-number" aria-label={`Ecuación ${block.number}`}>
                ({block.number})
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

function PreviewTableRows({
  table,
  indexes,
  header,
}: {
  table: SafeTablePreview;
  indexes: number[];
  header: boolean;
}) {
  const CellTag = header ? 'th' : 'td';
  return indexes.map((rowIndex) => {
    const row = table.rows[rowIndex];
    return (
      <tr
        className={`preview-table-row preview-table-row--rule-${row.ruleBefore}`}
        key={rowIndex}
      >
        {row.cells.map((cell, cellIndex) => {
          const hasLeftRule = table.verticalRules.includes(cell.column);
          const hasRightRule = table.verticalRules.includes(cell.column + cell.colSpan);
          return (
            <CellTag
              className={[
                'preview-table-cell',
                `preview-table-cell--${cell.alignment}`,
                hasLeftRule ? 'preview-table-cell--border-left' : '',
                hasRightRule ? 'preview-table-cell--border-right' : '',
              ].filter(Boolean).join(' ')}
              colSpan={cell.colSpan}
              rowSpan={cell.rowSpan}
              scope={header ? (cell.colSpan > 1 ? 'colgroup' : 'col') : undefined}
              key={cellIndex}
            >
              {cell.text}
            </CellTag>
          );
        })}
      </tr>
    );
  });
}

function PreviewTables({ tables }: { tables: SafeTablePreview[] }) {
  return (
    <>
      {tables.map((table, tableIndex) => (
        <figure
          className={`preview-table-figure${table.centered ? ' preview-table-figure--centered' : ''}`}
          key={tableIndex}
        >
          <div className="preview-table-scroll">
            <table
              className={[
                'preview-table',
                table.usesBooktabs ? 'preview-table--booktabs' : '',
                `preview-table--bottom-${table.bottomRule}`,
              ].filter(Boolean).join(' ')}
            >
              {table.caption && <caption>{table.caption}</caption>}
              {table.headerRows.length > 0 && (
                <thead>
                  <PreviewTableRows table={table} indexes={table.headerRows} header />
                </thead>
              )}
              <tbody>
                <PreviewTableRows
                  table={table}
                  indexes={table.rows
                    .map((_, index) => index)
                    .filter((index) => !table.headerRows.includes(index))}
                  header={false}
                />
              </tbody>
            </table>
          </div>
          {table.placement && (
            <figcaption className="preview-table-placement">
              Preferencia de colocación: [{table.placement}]
            </figcaption>
          )}
        </figure>
      ))}
    </>
  );
}

function PreviewFigures({ figures }: { figures: SafeFigurePreview[] }) {
  const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <>
      {figures.map((figure, figureIndex) => (
        <figure
          className={[
            'preview-figure',
            figure.centered ? 'preview-figure--centered' : '',
            figure.items.length > 1 ? 'preview-figure--panel' : '',
          ].filter(Boolean).join(' ')}
          key={figureIndex}
        >
          <div className="preview-figure-items">
            {figure.items.map((item, itemIndex) => {
              const imageWidth = item.image.widthPercent !== null
                ? `${item.image.widthPercent}%`
                : item.image.widthCm !== null
                  ? `${item.image.widthCm}cm`
                  : 'auto';
              return (
                <div
                  className="preview-figure-item"
                  key={itemIndex}
                  style={item.containerWidthPercent === null
                    ? undefined
                    : { flexBasis: `${item.containerWidthPercent}%` }}
                >
                  <img
                    alt={item.image.alt}
                    className="preview-figure-image"
                    decoding="async"
                    loading="lazy"
                    src={`${assetBase}${item.image.src}`}
                    style={{
                      transform: `rotate(${item.image.angle}deg)`,
                      width: imageWidth,
                    }}
                  />
                  {item.caption && (
                    <p className="preview-subfigure-caption">{item.caption}</p>
                  )}
                </div>
              );
            })}
          </div>
          {figure.caption && <figcaption>{figure.caption}</figcaption>}
          {figure.placement && (
            <p className="preview-figure-placement">
              Preferencia de colocación: [{figure.placement}]
            </p>
          )}
        </figure>
      ))}
    </>
  );
}

function PreviewFootnotes({ footnotes }: { footnotes: SafeFootnotePreview[] }) {
  return (
    <section className="preview-footnotes" aria-label="Notas al pie">
      <ol className="preview-footnotes-list">
        {footnotes.map((footnote) => (
          <li key={footnote.number} value={footnote.number}>
            {footnote.text}
          </li>
        ))}
      </ol>
    </section>
  );
}

function PreviewReferences({
  references,
  limitations,
}: {
  references: SafeResolvedReference[];
  limitations: string[];
}) {
  return (
    <section className="preview-references" aria-label="Referencias internas simuladas">
      <p className="preview-references-title">Referencias resueltas en esta vista</p>
      <ul className="preview-references-list">
        {references.map((reference, index) => {
          const command = reference.command === 'textsuperscript'
            ? `\\textsuperscript{\\ref{${reference.key}}}`
            : `\\${reference.command}{${reference.key}}`;
          return (
            <li key={`${reference.command}-${reference.key}-${index}`}>
              <code>{command}</code>
              <span aria-hidden="true"> → </span>
              <span>{reference.value}</span>
              {reference.linked && <span className="preview-reference-link"> enlace simulado</span>}
            </li>
          );
        })}
      </ul>
      {limitations.map((limitation, index) => (
        <p className="preview-reference-limitation" key={index}>{limitation}</p>
      ))}
    </section>
  );
}

function PreviewBibliography({
  entries,
  citations,
  limitations,
  width,
}: {
  entries: SafeBibliographyEntry[];
  citations: SafeCitation[];
  limitations: string[];
  width: string | null;
}) {
  return (
    <section className="preview-bibliography" aria-label="Bibliografía simulada">
      <div className="preview-bibliography-heading">
        <p className="preview-bibliography-title">Referencias bibliográficas</p>
        {width && <span className="preview-bibliography-width">ancho {'{'}{width}{'}'}</span>}
      </div>
      {entries.length > 0 ? (
        <ol className="preview-bibliography-list">
          {entries.map((entry) => (
            <li key={`${entry.number}-${entry.key}`} value={entry.number}>
              <span>{entry.text || 'Entrada sin datos visibles.'}</span>
              <code>{entry.key}</code>
            </li>
          ))}
        </ol>
      ) : (
        <p className="preview-bibliography-empty">Bibliografía vacía preparada para recibir entradas.</p>
      )}
      {citations.length > 0 && (
        <div className="preview-citations">
          <p className="preview-citations-title">Citas resueltas</p>
          <ul className="preview-citations-list">
            {citations.map((citation, index) => (
              <li key={`${citation.keys.join('-')}-${index}`}>
                <code>{`\\cite{${citation.keys.join(',')}}`}</code>
                <span aria-hidden="true"> → </span>
                <strong>{citation.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
      {limitations.map((limitation, index) => (
        <p className="preview-bibliography-limitation" key={index}>{limitation}</p>
      ))}
    </section>
  );
}

function PreviewProjectStructure({ result }: { result: SafeLatexPreviewResult }) {
  const structureId = useId();
  const titleId = `${structureId}-title`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  useEffect(() => {
    setPortalHost(document.body);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const closePopover = () => {
    clearCloseTimer();
    setOpen(false);
  };

  const scheduleHoverClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      if (!buttonRef.current?.matches(':focus') && !popoverRef.current?.matches(':hover')) {
        setOpen(false);
      }
      closeTimerRef.current = null;
    }, 120);
  };

  const updatePopoverPosition = () => {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return;

    const margin = 8;
    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const width = Math.min(popoverRect.width || 448, window.innerWidth - margin * 2);
    const left = Math.min(
      Math.max(margin, buttonRect.right - width),
      window.innerWidth - width - margin,
    );
    const belowTop = buttonRect.bottom + margin;
    const aboveTop = buttonRect.top - popoverRect.height - margin;
    const top = belowTop + popoverRect.height <= window.innerHeight - margin
      ? belowTop
      : Math.max(margin, aboveTop);

    setPopoverStyle({
      left: `${left}px`,
      top: `${Math.max(margin, top)}px`,
      visibility: 'visible',
    });
  };

  useEffect(() => {
    if (!open || !portalHost) return;
    setPopoverStyle({ visibility: 'hidden' });
    const frame = requestAnimationFrame(updatePopoverPosition);
    const handleViewportChange = () => updatePopoverPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, portalHost]);

  useEffect(() => {
    if (!open) return;

    const closeIfOutside = (event: Event) => {
      if (!(event.target instanceof Node)
        || (!containerRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target))) {
        closePopover();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closePopover();
      buttonRef.current?.focus({ preventScroll: true });
    };

    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('click', closeIfOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('click', closeIfOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node)
      || (!event.currentTarget.contains(nextTarget) && !popoverRef.current?.contains(nextTarget))) {
      closePopover();
    }
  };

  const popover = (
    <div
      ref={popoverRef}
      id={structureId}
      className="preview-project-popover"
      role="dialog"
      aria-labelledby={titleId}
      hidden={!open}
      style={popoverStyle}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleHoverClose}
      onPointerEnter={clearCloseTimer}
      onPointerLeave={scheduleHoverClose}
      onBlur={handleBlur}
    >
      <p className="preview-project-title" id={titleId}>Estructura reconocida</p>
      <div className="preview-project-zone">
        <strong>Preámbulo</strong>
        <code>{`\\documentclass{${result.documentClass ?? '??'}}`}</code>
        {result.packages.length > 0 && (
          <span>{result.packages.map((pkg) => pkg.name).join(', ')}</span>
        )}
      </div>
      <div className="preview-project-zone">
        <strong>Cuerpo</strong>
        <span>título, contenido y recursos del proyecto</span>
      </div>
      {result.hasTableOfContents && (
        <div className="preview-project-outline">
          <strong>Índice simulado</strong>
          <ol>
            {result.outline.map((item, index) => (
              <li
                className={`preview-project-outline-${item.level}`}
                key={`${item.number}-${index}`}
              >
                <span>{item.number}</span> {item.title}
              </li>
            ))}
          </ol>
        </div>
      )}
      {result.formattingUses.length > 0 && (
        <p className="preview-project-formatting">
          Formato reconocido:{' '}
          {result.formattingUses.map((use) => `\\${use.command}{${use.text}}`).join(' · ')}
        </p>
      )}
    </div>
  );

  return (
    <section
      className="preview-project-structure"
      aria-label="Estructura del proyecto simulada"
      onMouseEnter={() => { clearCloseTimer(); setOpen(true); }}
      onMouseLeave={scheduleHoverClose}
      onPointerEnter={() => { clearCloseTimer(); setOpen(true); }}
      onPointerLeave={scheduleHoverClose}
      onFocus={() => { clearCloseTimer(); setOpen(true); }}
      onBlur={handleBlur}
      ref={containerRef}
    >
      <button
        ref={buttonRef}
        type="button"
        className="preview-project-trigger"
        aria-label="Mostrar estructura reconocida"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={structureId}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">!</span>
      </button>
      {portalHost ? createPortal(popover, portalHost) : popover}
    </section>
  );
}

export default function SafeLatexPreviewPanel({
  result,
  lastValidResult,
}: SafeLatexPreviewPanelProps) {
  const id = useId();
  const headingId = `${id}-heading`;

  const hasErrors = result.errors.length > 0;
  const hasUnsupported = result.unsupportedCommands.length > 0;
  const hasParagraphs = result.paragraphs.length > 0;
  const hasPreviewBlocks = (result.previewBlocks?.length ?? 0) > 0;
  const hasTables = result.tables.length > 0;
  const hasFigures = result.figures.length > 0;
  const hasFootnotes = result.footnotes.length > 0;
  const hasReferences = result.references.length > 0;
  const hasBibliography = result.hasBibliography || result.citations.length > 0;
  const hasProjectStructure = result.documentClass !== null
    || result.packages.length > 0
    || result.hasTableOfContents
    || result.outline.length > 0
    || result.formattingUses.length > 0;
  const hasMaketitleContent = result.hasMaketitle && (result.title !== null || result.author !== null || result.date !== null);
  const hasAbstract = result.abstractParagraphs.length > 0;
  const hasContent = hasParagraphs || hasPreviewBlocks || hasTables || hasFigures || hasFootnotes || hasReferences || hasBibliography || hasProjectStructure || hasAbstract || hasMaketitleContent;
  const showLastValid = hasErrors
    && lastValidResult !== null
    && (
      lastValidResult.paragraphs.length > 0
      || (lastValidResult.previewBlocks?.length ?? 0) > 0
      || lastValidResult.tables.length > 0
      || lastValidResult.figures.length > 0
      || lastValidResult.footnotes.length > 0
      || lastValidResult.hasBibliography
      || lastValidResult.citations.length > 0
      || lastValidResult.references.length > 0
      || lastValidResult.documentClass !== null
      || lastValidResult.packages.length > 0
      || lastValidResult.outline.length > 0
      || lastValidResult.formattingUses.length > 0
    );

  const fontSizeClass = result.documentClassOption === '12pt'
    ? 'preview-size-12pt'
    : result.documentClassOption === '11pt'
      ? 'preview-size-11pt'
      : 'preview-size-10pt';

  const displayKind: PreviewDisplayKind = hasErrors
    ? hasContent ? 'partial' : 'invalid'
    : hasUnsupported
      ? 'unsupported'
      : hasContent
        ? 'valid'
        : 'empty';

  const statusMessage = getStatusMessage(displayKind);

  return (
    <div
      className="preview-panel"
      role="region"
      aria-labelledby={headingId}
    >
      <div className="preview-heading-row">
        <h4 className="preview-heading" id={headingId}>Vista previa</h4>
        {hasProjectStructure && <PreviewProjectStructure result={result} />}
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {hasErrors && (
        <div className="preview-errors" role="alert">
          <p className="preview-errors-title">Revisa el documento</p>
          <ul className="preview-errors-list">
            {result.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {hasUnsupported && (
        <div className="preview-unsupported">
          <p className="preview-unsupported-title">Función no disponible</p>
          <p className="preview-unsupported-message">
            Esta función todavía no está disponible en la vista previa de TexDock.
          </p>
          {result.unsupportedCommands.length > 0 && (
            <p className="preview-unsupported-commands">
              Comandos detectados: {result.unsupportedCommands.map((cmd) => `\\${cmd.slice(1)}`).join(', ')}
            </p>
          )}
        </div>
      )}

      {showLastValid && (
        <div className="preview-last-valid">
          <p className="preview-last-valid-label">Última vista previa válida (no representa el código actual):</p>
          {(lastValidResult.previewBlocks?.length ?? 0) > 0 ? (
            <PreviewBlocks blocks={lastValidResult.previewBlocks!} />
          ) : lastValidResult.tables.length > 0 ? (
            <PreviewTables tables={lastValidResult.tables} />
          ) : lastValidResult.figures.length > 0 ? (
            <PreviewFigures figures={lastValidResult.figures} />
          ) : (
            lastValidResult.paragraphs.map((paragraph, i) => (
              <p key={i} className="preview-paragraph">{paragraph}</p>
            ))
          )}
          {lastValidResult.footnotes.length > 0 && (
            <PreviewFootnotes footnotes={lastValidResult.footnotes} />
          )}
          {lastValidResult.references.length > 0 && (
            <PreviewReferences
              references={lastValidResult.references}
              limitations={lastValidResult.referenceLimitations}
            />
          )}
          {(lastValidResult.hasBibliography || lastValidResult.citations.length > 0) && (
            <PreviewBibliography
              entries={lastValidResult.bibliographyEntries}
              citations={lastValidResult.citations}
              limitations={lastValidResult.bibliographyLimitations}
              width={lastValidResult.bibliographyWidth}
            />
          )}
        </div>
      )}

      {hasContent && (
        <div className={`preview-content ${fontSizeClass}`}>
          {hasMaketitleContent && (
            <div className="preview-maketitle">
              {result.title && <p className="preview-maketitle-title">{result.title}</p>}
              {result.author && <p className="preview-maketitle-author">{result.author}</p>}
              {result.date && <p className="preview-maketitle-date">{result.date}</p>}
            </div>
          )}
          {hasAbstract && (
            <div className="preview-abstract">
              <p className="preview-abstract-label">{result.abstractLabel}</p>
              {result.abstractParagraphs.map((paragraph, i) => (
                <p key={i} className="preview-paragraph preview-abstract-text">{paragraph}</p>
              ))}
            </div>
          )}
          {hasPreviewBlocks ? (
            <PreviewBlocks blocks={result.previewBlocks!} />
          ) : (
            result.paragraphs.map((paragraph, i) => (
              <p key={i} className="preview-paragraph">{paragraph}</p>
            ))
          )}
          {hasTables && <PreviewTables tables={result.tables} />}
          {hasFigures && <PreviewFigures figures={result.figures} />}
          {hasFootnotes && <PreviewFootnotes footnotes={result.footnotes} />}
          {hasReferences && (
            <PreviewReferences
              references={result.references}
              limitations={result.referenceLimitations}
            />
          )}
          {hasBibliography && (
            <PreviewBibliography
              entries={result.bibliographyEntries}
              citations={result.citations}
              limitations={result.bibliographyLimitations}
              width={result.bibliographyWidth}
            />
          )}
        </div>
      )}

      {displayKind === 'empty' && (
        <div className="preview-empty">
          <p className="preview-empty-title">Documento vacío</p>
          <p className="preview-empty-message">
            El cuerpo del documento está vacío. Escribe texto entre {'\\begin{document}'} y {'\\end{document}'}.
          </p>
        </div>
      )}

      {displayKind === 'valid' && (
        <div className="preview-valid">
          <span className="preview-valid-text">Vista previa actualizada</span>
        </div>
      )}

      <style>{`
        .preview-panel {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--color-text);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .preview-heading {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-xs, 0.5rem);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .preview-heading-row {
          align-items: center;
          display: flex;
          justify-content: space-between;
          min-width: 0;
        }
        .preview-heading-row .preview-heading {
          margin-bottom: var(--space-xs, 0.5rem);
        }
        .preview-inline-math {
          margin: 0 0.15em;
        }
        .preview-underline {
          text-decoration: underline;
          text-decoration-thickness: 0.08em;
          text-underline-offset: 0.15em;
        }
        .preview-document-heading {
          color: var(--color-text);
          overflow-wrap: anywhere;
        }
        .preview-document-heading--section {
          margin: 1.35rem 0 0.65rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid var(--color-border-strong);
          font-size: clamp(1.25rem, 2.2vw, 1.55rem);
          font-weight: 750;
          line-height: 1.25;
        }
        .preview-document-heading--subsection {
          margin: 1rem 0 0.45rem;
          font-size: clamp(1.05rem, 1.8vw, 1.22rem);
          font-weight: 680;
          line-height: 1.3;
        }
        .preview-document-heading--subsubsection {
          margin: 0.8rem 0 0.35rem;
          font-size: 0.98rem;
          font-weight: 650;
          line-height: 1.35;
          color: var(--color-text-secondary);
        }
        .preview-heading-number {
          color: var(--color-text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .preview-list {
          margin: 0.45rem 0 0.75rem;
          padding-left: clamp(1.25rem, 4vw, 1.75rem);
        }
        .preview-list li {
          padding-left: 0.15rem;
        }
        .preview-list li + li {
          margin-top: 0.35rem;
        }
        .preview-list .preview-paragraph {
          margin: 0;
        }
        .preview-list .preview-list {
          margin: 0.35rem 0 0.2rem;
          padding-left: clamp(1.1rem, 3.5vw, 1.55rem);
        }
        .preview-list--unordered {
          list-style-type: disc;
        }
        .preview-list--unordered .preview-list--unordered {
          list-style-type: circle;
        }
        .preview-list--unordered .preview-list--unordered .preview-list--unordered {
          list-style-type: square;
        }
        .preview-list--ordered {
          list-style-type: decimal;
        }
        .preview-list--ordered .preview-list--ordered {
          list-style-type: lower-alpha;
        }
        .preview-list--ordered .preview-list--ordered .preview-list--ordered {
          list-style-type: lower-roman;
        }
        .preview-math-block {
          position: relative;
          overflow-x: auto;
          padding: var(--space-xs, 0.25rem) 0;
        }
        .preview-equation {
          padding-right: 2.75rem;
        }
        .preview-equation-number {
          position: absolute;
          top: 50%;
          right: var(--space-xs, 0.25rem);
          transform: translateY(-50%);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }
        .preview-formal {
          border-left: 3px solid var(--color-math);
          padding: var(--space-sm, 0.5rem);
          margin: var(--space-sm, 0.5rem) 0;
          background: var(--color-surface-subtle);
        }
        .preview-formal-title {
          font-weight: 700;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-table-figure {
          margin: var(--space-sm, 0.5rem) 0;
          max-width: 100%;
        }
        .preview-table-figure--centered .preview-table {
          margin-inline: auto;
        }
        .preview-table-scroll {
          max-width: 100%;
          overflow-x: auto;
        }
        .preview-table {
          border-collapse: collapse;
          color: var(--color-text);
          min-width: max-content;
        }
        .preview-table caption {
          caption-side: top;
          font-weight: 600;
          margin-bottom: var(--space-xs, 0.25rem);
          text-align: center;
        }
        .preview-table-cell {
          padding: 0.3rem 0.55rem;
          vertical-align: middle;
        }
        .preview-table-cell--left {
          text-align: left;
        }
        .preview-table-cell--center {
          text-align: center;
        }
        .preview-table-cell--right {
          text-align: right;
        }
        .preview-table-cell--border-left {
          border-left: 1px solid var(--color-border-strong);
        }
        .preview-table-cell--border-right {
          border-right: 1px solid var(--color-border-strong);
        }
        .preview-table-row--rule-standard > .preview-table-cell {
          border-top: 1px solid var(--color-border-strong);
        }
        .preview-table-row--rule-strong > .preview-table-cell {
          border-top: 2px solid var(--color-text);
        }
        .preview-table-row--rule-partial > .preview-table-cell:not(:first-child) {
          border-top: 1px solid var(--color-border-strong);
        }
        .preview-table--booktabs {
          border-bottom: 2px solid var(--color-text);
        }
        .preview-table--bottom-standard {
          border-bottom: 1px solid var(--color-border-strong);
        }
        .preview-table--bottom-strong {
          border-bottom: 2px solid var(--color-text);
        }
        .preview-table-placement {
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          margin-top: var(--space-xs, 0.25rem);
          text-align: center;
        }
        .preview-figure {
          margin: var(--space-md, 1rem) 0;
          max-width: 100%;
        }
        .preview-figure--centered {
          text-align: center;
        }
        .preview-figure-items {
          align-items: center;
          display: flex;
          gap: var(--space-sm, 0.5rem);
          max-width: 100%;
          overflow-x: auto;
        }
        .preview-figure:not(.preview-figure--panel) .preview-figure-items {
          display: block;
        }
        .preview-figure-item {
          flex: 0 0 auto;
          min-width: 0;
          max-width: 100%;
        }
        .preview-figure--centered .preview-figure-image {
          margin-inline: auto;
        }
        .preview-figure-image {
          display: block;
          height: auto;
          max-width: 100%;
          transform-origin: center;
        }
        .preview-figure figcaption,
        .preview-subfigure-caption {
          color: var(--color-text);
          font-size: 0.8125rem;
          margin: var(--space-xs, 0.25rem) 0 0;
          text-align: center;
        }
        .preview-subfigure-caption::before {
          content: '(' counter(subfigure, lower-alpha) ') ';
          counter-increment: subfigure;
        }
        .preview-figure--panel .preview-figure-items {
          counter-reset: subfigure;
        }
        .preview-figure-placement {
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          margin: var(--space-xs, 0.25rem) 0 0;
          text-align: center;
        }
        .preview-paragraph {
          margin: 0 0 var(--space-xs, 0.5rem);
          white-space: pre-line;
          overflow-wrap: break-word;
        }
        .preview-paragraph:last-child {
          margin-bottom: 0;
        }
        .preview-footnotes {
          border-top: 1px solid var(--color-border-strong);
          font-size: 0.75rem;
          margin-top: var(--space-md, 1rem);
          padding-top: var(--space-xs, 0.5rem);
        }
        .preview-footnotes-list {
          margin: 0;
          padding-left: 1.5rem;
        }
        .preview-footnotes-list li {
          margin-bottom: 0.2rem;
          padding-left: 0.15rem;
        }
        .preview-footnotes-list li:last-child {
          margin-bottom: 0;
        }
        .preview-references {
          background: var(--color-surface-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm, 4px);
          font-size: 0.75rem;
          margin-top: var(--space-md, 1rem);
          padding: var(--space-sm, 0.5rem);
        }
        .preview-references-title {
          font-weight: 700;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-references-list {
          margin: 0;
          padding-left: 1.25rem;
        }
        .preview-references-list code {
          overflow-wrap: anywhere;
        }
        .preview-reference-link {
          color: var(--color-code);
          font-size: 0.6875rem;
          margin-left: 0.35rem;
        }
        .preview-reference-limitation {
          color: var(--color-text-secondary);
          margin: var(--space-xs, 0.25rem) 0 0;
        }
        .preview-bibliography {
          border-top: 1px solid var(--color-border-strong);
          font-size: 0.75rem;
          margin-top: var(--space-md, 1rem);
          padding-top: var(--space-sm, 0.5rem);
        }
        .preview-bibliography-heading {
          align-items: baseline;
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs, 0.25rem);
          justify-content: space-between;
        }
        .preview-bibliography-title,
        .preview-citations-title {
          font-weight: 700;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-bibliography-width {
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
        }
        .preview-bibliography-list,
        .preview-citations-list {
          margin: 0;
          padding-left: 1.5rem;
        }
        .preview-bibliography-list li {
          margin-bottom: var(--space-xs, 0.25rem);
          padding-left: 0.15rem;
        }
        .preview-bibliography-list code {
          color: var(--color-text-secondary);
          display: block;
          font-size: 0.6875rem;
          margin-top: 0.1rem;
        }
        .preview-bibliography-empty {
          color: var(--color-text-secondary);
          font-style: italic;
          margin: 0;
        }
        .preview-citations {
          background: var(--color-surface-subtle);
          border-radius: var(--radius-sm, 4px);
          margin-top: var(--space-sm, 0.5rem);
          padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
        }
        .preview-citations-list code {
          color: var(--color-code);
        }
        .preview-bibliography-limitation {
          color: var(--color-text-secondary);
          font-size: 0.6875rem;
          margin: var(--space-xs, 0.25rem) 0 0;
        }
        .preview-project-structure {
          display: flex;
          justify-content: flex-end;
          flex: 0 0 auto;
          margin: 0 0 var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
        }
        .preview-project-trigger {
          align-items: center;
          background: var(--color-practice-soft);
          border: 1px solid var(--color-practice);
          border-radius: 50%;
          color: var(--color-practice);
          cursor: pointer;
          display: inline-flex;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          font-weight: 800;
          height: 1.5rem;
          justify-content: center;
          line-height: 1;
          width: 1.5rem;
        }
        .preview-project-trigger:hover,
        .preview-project-trigger[aria-expanded="true"] {
          background: var(--color-practice);
          color: var(--color-bg);
        }
        .preview-project-trigger:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 3px;
        }
        .preview-project-popover {
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm, 4px);
          box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
          font-size: 0.75rem;
          max-height: min(24rem, calc(100dvh - 2rem));
          max-width: min(28rem, calc(100vw - 2rem));
          min-width: min(18rem, calc(100vw - 2rem));
          overflow: auto;
          padding: var(--space-sm, 0.5rem);
          position: fixed;
          z-index: 10;
        }
        .preview-project-popover[hidden] {
          display: none;
        }
        .preview-project-title {
          font-weight: 700;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-project-zone {
          align-items: baseline;
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs, 0.25rem);
          margin-top: var(--space-xs, 0.25rem);
        }
        .preview-project-zone strong {
          min-width: 4.5rem;
        }
        .preview-project-outline {
          border-top: 1px solid var(--color-border);
          margin-top: var(--space-sm, 0.5rem);
          padding-top: var(--space-xs, 0.25rem);
        }
        .preview-project-outline ol {
          list-style: none;
          margin: var(--space-xs, 0.25rem) 0 0;
          padding: 0;
        }
        .preview-project-outline li {
          margin-top: 0.15rem;
        }
        .preview-project-outline li span {
          display: inline-block;
          font-family: var(--font-mono);
          min-width: 2rem;
        }
        .preview-project-outline-subsection {
          padding-left: var(--space-sm, 0.5rem);
        }
        .preview-project-outline-subsubsection {
          padding-left: var(--space-md, 1rem);
          color: var(--color-text-secondary);
          font-size: 0.92em;
        }
        .preview-project-formatting,
        .preview-project-limitation {
          color: var(--color-text-secondary);
          margin: var(--space-xs, 0.25rem) 0 0;
          overflow-wrap: anywhere;
        }
        .preview-errors {
          background: var(--color-bg);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-sm, 0.5rem);
          margin-bottom: var(--space-sm, 0.5rem);
          flex-shrink: 0;
        }
        .preview-errors-title {
          font-weight: 600;
          color: var(--color-danger);
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-errors-list {
          margin: 0;
          padding-left: 1.25rem;
          color: var(--color-danger);
        }
        .preview-errors-list li {
          margin-bottom: 0.25rem;
        }
        .preview-unsupported {
          background: var(--color-bg);
          border: 1px solid var(--color-warning);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-sm, 0.5rem);
          margin-bottom: var(--space-sm, 0.5rem);
          flex-shrink: 0;
        }
        .preview-unsupported-title {
          font-weight: 600;
          color: var(--color-warning);
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-unsupported-message {
          color: var(--color-warning);
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-unsupported-commands {
          color: var(--color-warning);
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.8125rem;
        }
        .preview-last-valid {
          background: var(--color-bg);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-sm, 4px);
          padding: var(--space-sm, 0.5rem);
          margin-bottom: var(--space-sm, 0.5rem);
          flex-shrink: 0;
        }
        .preview-last-valid-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-xs, 0.25rem);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .preview-empty {
          color: var(--color-text-secondary);
        }
        .preview-empty-title {
          font-weight: 600;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-empty-message {
          margin: 0;
          font-style: italic;
        }
        .preview-valid {
          margin-top: var(--space-xs, 0.25rem);
          flex-shrink: 0;
        }
        .preview-valid-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-success);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .preview-maketitle {
          text-align: center;
          margin-bottom: var(--space-md, 1rem);
        }
        .preview-maketitle-title {
          font-size: 1.15em;
          font-weight: 700;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-maketitle-author {
          margin: 0;
        }
        .preview-maketitle-date {
          margin: 0;
          font-size: 0.9em;
          color: var(--color-text-secondary);
        }
        .preview-abstract {
          margin: 0 0 var(--space-md, 1rem);
          padding: 0 var(--space-md, 1rem);
        }
        .preview-abstract-label {
          font-size: 0.9em;
          font-weight: 700;
          text-align: center;
          margin: 0 0 var(--space-xs, 0.25rem);
        }
        .preview-abstract-text {
          font-size: 0.9em;
        }
        .preview-size-10pt .preview-paragraph {
          font-size: 0.8125rem;
        }
        .preview-size-11pt .preview-paragraph {
          font-size: 0.875rem;
        }
        .preview-size-12pt .preview-paragraph {
          font-size: 0.9375rem;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
