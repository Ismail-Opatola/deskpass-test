import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { usePopper } from "react-popper";
import customStyles from "./Tooltip.module.css";

const Tooltip = ({ children, title, placement, arrow }) => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);

  const customModifiers = useMemo(
    () => [
      {
        name: "arrow",
        enabled: arrow,
        options: { element: arrowElement },
      },
      {
        name: "flip",
        options: {
          fallbackPlacements: ["auto"],
        },
      },
      {
        name: "offset",
        options: {
          offset: ({ placement }) => {
            if (
              placement === "bottom-start" ||
              placement === "bottom" ||
              placement === "bottom-end"
            ) {
              return [0, 15];
            } else {
              return [0, 10];
            }
          },
        },
      },
      {
        name: "preventOverflow",
        options: {
          padding: 2,
        },
      },
    ],
    [arrow, arrowElement]
  );

  const { styles, attributes, ...rest } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: placement,
      strategy: "fixed",
      modifiers: customModifiers,
    }
  );

  function show() {
    popperElement.setAttribute("data-show", "");

    // We need to tell Popper to update the tooltip position
    // after we show the tooltip, otherwise it will be incorrect
    rest.update();
  }

  function hide() {
    popperElement.removeAttribute("data-show");
  }

  return (
    <div className={`${customStyles.container}`}>
      <span
        ref={setReferenceElement}
        className={`${customStyles["tooltip-element"]}`}
        onBlur={hide}
        onFocus={show}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>
      <div
        ref={setPopperElement}
        className={`${customStyles.tooltip}`}
        style={styles.popper}
        {...attributes.popper}
      >
        <div className={`${customStyles["tooltip-label"]}`}>{title}</div>
        {arrow && (
          <div
            ref={setArrowElement}
            className={`${customStyles["arrow"]}`}
            style={styles.arrow}
          />
        )}
      </div>
    </div>
  );
};

Tooltip.defaultProps = {
  placement: "top",
  arrow: false,
};

Tooltip.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  arrow: PropTypes.bool,
  placement: PropTypes.oneOf([
    "top-start",
    "top",
    "top-end",
    "right-start",
    "right",
    "right-end",
    "bottom-start",
    "bottom",
    "bottom-end",
    "left-start",
    "left",
    "left-end",
  ]),
};

export default Tooltip;
