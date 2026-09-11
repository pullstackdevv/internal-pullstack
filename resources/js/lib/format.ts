export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount);
}

const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatIndonesianDate(isoDate: string): string {
    const date = new Date(isoDate);
    return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function currentMonthLabel(): string {
    const date = new Date();
    return `${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}
