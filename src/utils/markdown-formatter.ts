import chalk from 'chalk';

/**
 * Format markdown content for terminal display with ANSI colors
 */
export function formatMarkdownForTerminal(markdown: string): string {
  let formatted = markdown;

  // Headers (# ## ### etc.)
  formatted = formatted.replace(/^### (.+)$/gm, (_, text: string) => chalk.bold.cyan(`### ${text}`));
  formatted = formatted.replace(/^## (.+)$/gm, (_, text: string) => chalk.bold.blue(`## ${text}`));
  formatted = formatted.replace(/^# (.+)$/gm, (_, text: string) => chalk.bold.magenta(`# ${text}`));

  // Bold text (**text** or __text__)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, (_, text: string) => chalk.bold(text));
  formatted = formatted.replace(/__(.+?)__/g, (_, text: string) => chalk.bold(text));

  // Italic text (*text* or _text_)
  formatted = formatted.replace(/\*(.+?)\*/g, (_, text: string) => chalk.italic(text));
  formatted = formatted.replace(/_(.+?)_/g, (_, text: string) => chalk.italic(text));

  // Inline code (`code`)
  formatted = formatted.replace(/`([^`]+)`/g, (_, code: string) => chalk.bgGray.white(` ${code} `));

  // Links [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, url: string) => chalk.cyan.underline(text) + chalk.gray(` (${url})`));

  // Code blocks (```lang ... ```)
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang ? chalk.gray(`[${lang}]`) + '\n' : '';
    return langLabel + chalk.dim(code);
  });

  // Bullet points
  formatted = formatted.replace(/^- (.+)$/gm, (_, text: string) => chalk.yellow('●') + ' ' + text);
  formatted = formatted.replace(/^\* (.+)$/gm, (_, text: string) => chalk.yellow('●') + ' ' + text);

  // Numbered lists
  formatted = formatted.replace(/^(\d+)\. (.+)$/gm, (_, num: string, text: string) => chalk.yellow(`${num}.`) + ' ' + text);

  return formatted;
}

/**
 * Strip HTML tags from text
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Clean highlighted text by removing HTML tags
 * Used for Algolia search results that contain <em> tags for highlighting
 */
export function cleanHighlight(text: string): string {
  return stripHtmlTags(text);
}

/**
 * Format highlighted text for terminal display
 * Converts Algolia highlight tags to yellow highlighting
 * Supports both <em> tags and <span class="algolia-docsearch-suggestion--highlight"> tags
 */
export function formatHighlight(text: string): string {
  // Handle Algolia's highlight spans
  let formatted = text.replace(/<span class="algolia-docsearch-suggestion--highlight">(.+?)<\/span>/g, chalk.yellow('$1'));
  // Handle <em> tags
  formatted = formatted.replace(/<em>(.+?)<\/em>/g, chalk.yellow('$1'));
  // Remove any remaining HTML tags
  formatted = stripHtmlTags(formatted);
  return formatted;
}
