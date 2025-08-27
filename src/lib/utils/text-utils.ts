export function convertToTitleCase(str: string) {
    if (!str) {
        return ""
    }

    return str.toLowerCase().split(' ').map(function (word) {
        return word.charAt(0).toUpperCase().concat(word.substring(1));
    }).join(' ');
}

export function formatDateString(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toDateString()
    } catch {
        return dateStr;
    }
}
export function truncateMiddle(text: string|undefined, maxLength: number = 30): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;

    const start = text.slice(0, Math.ceil(maxLength / 2));
    const end = text.slice(-Math.floor(maxLength / 2));
    return `${start}...${end}`;
}