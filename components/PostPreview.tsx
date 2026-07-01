import CategoryIcon from './CategoryIcon'
import { CATEGORY_TAG_STYLE, categoryPlaceholderBg, CATEGORY_ICON_OPACITY } from '@/utils/categoryStyle'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner',
  lfs_shirt: 'LFS Sportshirt',
  clothing: 'Klamotten',
  notebook: 'Schulhefte',
  lecture: 'Lektüren',
  supplies: 'Schulzubehör',
  other: 'Sonstiges'
}

interface Props {
  title: string
  description: string
  price: string
  isFree: boolean
  category: string
  imagePreview?: string
  sellerName: string
}

export default function PostPreview({ title, description, price, isFree, category, imagePreview, sellerName }: Props) {
  const catStyle = Object.fromEntries(
    CATEGORY_TAG_STYLE.split(';').filter(Boolean).map(s => s.split(':'))
  )
  const priceNum = parseFloat(price)
  const showAsFree = isFree || (price !== '' && !isNaN(priceNum) && priceNum === 0)

  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        Vorschau
      </p>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', maxWidth: '260px' }}>
        <div style={{ aspectRatio: '4/3', background: categoryPlaceholderBg(category), display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {imagePreview
            ? <img src={imagePreview} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ opacity: CATEGORY_ICON_OPACITY }}><CategoryIcon category={category} size={46} color="var(--tag-color)" /></span>
          }
          <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', fontWeight: 500, padding: '3px 8px', borderRadius: '3px', ...catStyle }}>
            {categoryLabel[category]}
          </span>
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title || 'Titel des Artikels'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {description || 'Beschreibung des Artikels...'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            {showAsFree
              ? <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--state-success)', background: 'var(--state-success-bg)', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>🎁 Verschenken</span>
              : <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-primary)', flexShrink: 0 }}>{!isNaN(priceNum) ? priceNum.toFixed(2) : '0,00'} €</span>
            }
            <span style={{ fontSize: '10px', color: 'var(--text-faint)', background: 'var(--bg-page)', padding: '2px 7px', borderRadius: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sellerName}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
