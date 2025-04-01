// components/Button.tsx
import React from 'react'
interface ButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  showNumberOnlyOnMobile?: boolean
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  icon,
  label,
  showNumberOnlyOnMobile,
}) => {
  const accessibleLabel =
    /*ariaLabel ||*/ label || (typeof icon === 'string' ? icon : '버튼')
  return (
    <button
      onClick={onClick}
      className="default-button"
      aria-label={accessibleLabel}
    >
      <span>{icon}</span>
      {label &&
        (showNumberOnlyOnMobile ? (
          <>
            <span className="inline sm:hidden">
              {label.match(/\(\d+\)/)?.[0] || label}{' '}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          <span className="hidden sm:inline">{label}</span>
        ))}
    </button>
  )
}

export default Button
