import React from 'react'
import Controller from '../animated/Controller'
import { toArray } from '../shared/helpers'
export function useTrail({
  items,
  reverse,
  delay,
  onKeyframesHalt = () => null,
  updatePropsOnRerender = true,
  onRest,
  ...props
}) {
  const instances = React.useRef()
  const prevItems = React.useRef()
  const array = toArray(items)
  const mounted = React.useRef(false)

  const onHalt = onRest
    ? ctrl => ({ finished }) => {
        finished && mounted.current && onRest(ctrl.merged)
      }
    : onKeyframesHalt

  if (prevItems.current !== items) {
    instances.current = new Map(
      array.map((_, idx) => [idx, new Controller(props)])
    )
  }

  const update = React.useCallback(
    /** resolve and last are passed to the update function from the keyframes controller */
    props => {
      for (let [idx, ctrl] of instances.current.entries()) {
        if (idx === 0) {
          ctrl.update({ ...props, delay, attach: undefined })
        }
        ctrl.update(
          { ...props, attach: () => instances.current.get(idx - 1) },
          instances.current.size - 1 === idx && onHalt(ctrl)
        )
      }
    },
    [onRest]
  )

  /** must hoooks always return something? */
  React.useEffect(() => {
    mounted.current = true
    return () => void (mounted.current = false)
  }, [])

  React.useLayoutEffect(() => {
    prevItems.current = items
    if (updatePropsOnRerender) update(props)
  })

  return array.map((item, idx) => ({
    item,
    props: instances.current
      .get(reverse ? instances.current.size - (idx + 1) : idx)
      .getValues(),
  }))
}
