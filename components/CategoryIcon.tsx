const paths: Record<string, string> = {
  calculator: 'M6 2.5h12a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z M7.5 5.5h9v4h-9v-4Z M8.5 13h1.6 M11.7 13h1.6 M14.9 13h1.6 M8.5 16h1.6 M11.7 16h1.6 M14.9 16h1.6 M8.5 19h1.6 M11.7 19h1.6 M14.9 19h1.6',
  lfs_shirt: 'M8 3 4 6.5 6.2 9.5 8 8v11.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8l1.8 1.5L20 6.5 16 3c-.8 1.6-2.3 2.7-4 2.7S8.8 4.6 8 3Z',
  clothing: 'M9 4h6 M9 4c0 1.7-1.3 3-3 3l-3 3 2.5 2.5L7 11v9.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V11l1.5 1.5L21 10l-3-3c-1.7 0-3-1.3-3-3',
  notebook: 'M5 3.5h12a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z M5 7h13 M8 3.5v3.5 M9 10.5h7 M9 13.5h7 M9 16.5h5',
  lecture: 'M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2V5Z M20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2V5Z',
  supplies: 'M12 2.5 4 7v3.5l8 4.5 8-4.5V7l-8-4.5Z M4 10.5v7L12 22l8-4.5v-7 M12 15v7',
  other: 'M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z M4 8.5 12 13l8-4.5 M12 13v7'
}

const viewBoxDefault = '0 0 24 24'

export default function CategoryIcon({ category, size = 18, color = 'currentColor' }: { category: string, size?: number, color?: string }) {
  const d = paths[category] || paths.other
  return (
    <svg width={size} height={size} viewBox={viewBoxDefault} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
