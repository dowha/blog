// components/Button.tsx
import React from 'react'

interface ButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
}

const Button: React.FC<ButtonProps> = ({ onClick, icon, label }) => {
  return (
    <button onClick={onClick} className="default-button">
      <span>{icon}</span>
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  )
}

export default Button
