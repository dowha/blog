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
  return (
    <button onClick={onClick} className="default-button">
      <span>{icon}</span>
      {label &&
        (showNumberOnlyOnMobile ? (
          <>
            <span className="inline sm:hidden">
              {label.match(/\(\d+\)/)?.[0] || label}{' '}
              {/* 괄호 포함 숫자만 표시 */}
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
