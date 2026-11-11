import type { SelectHTMLAttributes } from 'react'

/**
 * <select> con el mismo estilo que los demás campos.
 * Safari aplica su diseño nativo a los select e ignora el padding,
 * así que lo quitamos con "appearance-none" y dibujamos nuestra propia flecha.
 */
export default function CampoSelect({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative mt-1">
      <select
        {...props}
        className={`w-full appearance-none rounded-xl bg-gray-100 py-3 pr-10 pl-4 text-base outline-none dark:bg-gray-800 ${className}`}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
