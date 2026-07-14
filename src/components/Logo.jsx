// Logo CostChef — fonte unica da marca no app.
// Paths copiados exatamente dos SVGs em src/assets/logo/ (nao redesenhar).

const HAT  = 'M62 149.5 L62 118 A33 33 0 1 1 61.26 52.02 A40 40 0 0 1 138.74 52.02 A33 33 0 1 1 138 118 L138 149.5'
const BAR1 = 'M80 149.5 L80 130'
const BAR2 = 'M100 149.5 L100 116'
const BAR3 = 'M120 149.5 L120 102'

const LARANJA = '#F97316'
const FONT = "Poppins, Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

function cores(theme) {
  if (theme === 'dark') return { principal: '#FFFFFF', destaque: LARANJA }
  if (theme === 'mono') return { principal: 'currentColor', destaque: 'currentColor' }
  return { principal: '#111111', destaque: LARANJA }   // light (default)
}

function Simbolo({ principal, destaque }) {
  return (
    <>
      <path d={HAT}  stroke={principal} />
      <path d={BAR1} stroke={destaque} />
      <path d={BAR2} stroke={destaque} />
      <path d={BAR3} stroke={destaque} />
    </>
  )
}

export default function Logo({ variant = 'lockup', theme = 'light', size = 32, ...rest }) {
  const { principal, destaque } = cores(theme)

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
        role="img" aria-label="CostChef" {...rest}>
        <g transform="translate(0,14)" fill="none" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
          <Simbolo principal={principal} destaque={destaque} />
        </g>
      </svg>
    )
  }

  // lockup: simbolo + wordmark "CostChef" (viewBox 340x110)
  const w = Math.round(size * (340 / 110))
  return (
    <svg width={w} height={size} viewBox="0 0 340 110" xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="CostChef" {...rest}>
      <g transform="translate(10,20) scale(0.5054) translate(-21.5,-30.5)"
        fill="none" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
        <Simbolo principal={principal} destaque={destaque} />
      </g>
      <text x="104" y="55" fontFamily={FONT} fontSize="46" fontWeight="600"
        letterSpacing="-1" dominantBaseline="central">
        <tspan fill={principal}>Cost</tspan><tspan fill={destaque}>Chef</tspan>
      </text>
    </svg>
  )
}
