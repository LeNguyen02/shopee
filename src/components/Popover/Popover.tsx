import {
  type ElementType,
  useId,
  useRef,
  useState
} from 'react'

import {
  AnimatePresence,
  motion
} from 'framer-motion'

import {
  arrow,
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  type Placement,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole
} from '@floating-ui/react'

interface Props {
  children: React.ReactNode
  renderPopover: React.ReactNode
  className?: string
  as?: ElementType
  initialOpen?: boolean
  placement?: Placement
  trigger?: 'hover' | 'click'
}

export default function Popover({
  children,
  className,
  renderPopover,
  as: Element = 'div',
  initialOpen,
  placement = 'bottom-end',
  trigger = 'hover'
}: Props) {
  const [open, setOpen] = useState(initialOpen || false)

  const arrowRef = useRef<HTMLElement>(null)
  const data = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [offset(10), flip(), shift(), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
    transform: false,
    placement
  })
  const { refs, floatingStyles, context } = data
  const hover = useHover(context, { handleClose: safePolygon(), enabled: trigger === 'hover' })
  const click = useClick(context, { enabled: trigger === 'click' })
  const focus = useFocus(context, { enabled: false })
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: trigger === 'click' ? 'menu' : 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, focus, dismiss, role])
  const id = useId()

  return (
    <Element className={className} ref={refs.setReference} {...getReferenceProps()}>
      {children}
      <FloatingPortal id={id}>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={refs.setFloating}
              style={{
                transformOrigin: `${data.middlewareData.arrow?.x}px top`,
                ...floatingStyles
              }}
              {...getFloatingProps()}
              initial={{ opacity: 0, transform: `scale(0)` }}
              animate={{ opacity: 1, transform: `scale(1)` }}
              exit={{ opacity: 0, transform: `scale(0)` }}
              transition={{ duration: 0.2 }}
            >
              <span
                ref={arrowRef}
                className='relative z-10 translate-y-[-95%] border-[11px] border-x-transparent border-t-transparent border-b-white'
                style={{
                  left: data.middlewareData.arrow?.x,
                  top: data.middlewareData.arrow?.y,
                  zIndex: 99999999
                }}
              />
              {renderPopover}
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </Element>
  )
}
