import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { usePopper } from "react-popper";
import customStyles from "./Tooltip.module.css";

/**
 * Tooltip Component
 * ---
 * Tooltips display informative text when users hover over, focus on, or tap an element. 
 * @param {JSX.Element | string} title 
 * @param {string} placement 
 * @param {boolean} arrow
 * @returns {JSX.Element}
 * ---
 * When activated, Tooltips display a text label identifying an element, such as a description of its function.
 *
 * * Use `title` prop to specify and display a text identifying an element, such as a description of its function.
 *
 * * You can use the `placement` prop to change tooltip position. Tooltip has 12 placements choice: `"top-start" | "top" | "top-end" | "right-start" | "right" | "right-end" | "bottom-start" | "bottom" | "bottom-end" | "left-start" | "left" | "left-end"`
 *
 * * You can use the `arrow` prop to give your tooltip an arrow indicating which element it refers to.
 * 
 * Why `popper.js`?
 * ---
 * 
 * This tooltip component use `popper.js` a _positioning engine_ to handle the tooltip element position. Popular UI libraries such as __Bootstrap, Material UI__ make use of `popper.js` internally to handle the same functionality. `react-popper` is just a wrapper around `popper.js` which expose popper apis to react as popper is built to work directly with the DOM.
 * 
 * Getting the size and position of elements in React is not quite simple. Each option I researched has at least one issue.
 *
 * You can use `Element.getClientRects()` and `Element.getBoundingClientRect()` to get the size and position of an element. In React, you’ll first need to get a reference to that element. Here’s an example of how you might do that. 
 * 
 *     function RectangleComponent() {
 *       return (
 *         <div
 *           ref={el => {
 *             if (!el) return;
 *   
 *             console.log(el.getBoundingClientRect().width); // prints 200px
 *           }}
 *           style={{
 *             display: "inline-block",
 *             width: "200px",
 *             height: "100px",
 *             background: blue
 *           }}
 *         />
 *       );
 *     }
 * 
 * This will print the element’s `width` to the console. This is what we expect because we set the `width` to `200px` in style attribute.
 * 
 * __The Problem__
 * 
 * This basic approach will fail if the `size` or `position` of the element is dynamic, such as in the following scenarios.
 * 
 * The element contains images and other resources which load asynchronously
 * * Animations
 * * Dynamic content
 * * Window resizing
 * 
 * These are obvious, but here’s a more sneaky scenario.
 * 
 *     function ComponentWithTextChild() {
 *       return (
 *         <div
 *           ref={el => {
 *             if (!el) return;
*
 *             console.log(el.getBoundingClientRect().width);
 *             setTimeout(() => {
 *               // usually prints a value that is larger than the first console.log
 *               console.log("later", el.getBoundingClientRect().width);
 *             });
 *             setTimeout(() => {
 *               // usually prints a value that is larger than the second console.log
 *               console.log("way later", el.getBoundingClientRect().width);
 *             }, 1000);
 *           }}
 *           style={{ display: "inline-block" }}
 *         >
 *           <div>Check it out, here is some text in a child element</div>
 *         </div>
 *       );
 *     }
 * 
 * This example renders a simple div with a single text node as its only child. It logs out the width of that element immediately, then again in the next cycle of the event loop and a third time one second later. Since we only have static content, you might expect that the width would be the same at all three times, but it is not. When I ran this example on my computer, the first width was `304.21875`, the second time it was `353.125` and the third it was `358.078`.
 * 
 * Interestingly, this problem does not happen when we perform the same DOM manipulations with vanilla JS.

 *      const div = document.createElement('div')
 *      div.style.display = 'inline-block';
 *      const p = document.createElement('p');
 *      p.innerText = 'Hello world this is some text';
 *      div.appendChild(p);
 *      document.body.appendChild(div);
 *      console.log('width after appending', div.getBoundingClientRect().width);
 *      setTimeout(() => console.log('width after a tick', div.getBoundingClientRect().width));
 *      setTimeout(() => console.log('width after a 100ms', div.getBoundingClientRect().width), 100);
 * 
 * If you paste this into a console, you will see that the initial width value is correct. Therefore the problem is specific to React.
 * 
 * Another approach involves using `ResizeObserver`
 * ---
 * `ResizeObserver` is a new-ish DOM API that will notify us when the size of element changes. The issue with this approach is that it doesn’t provide position updates, only size.
 * 
 * 
 * The Solution: Using Popper.js
 * ---
 * I looked into `Material-UI's Tooltips` source code to see how tooltips and other modals positioning are handled and found they use `popper.js` to handle positioning. The only time I've come across `popper.js` was when using `Bootstrap` CSS library.
 * 
 * Positioning tooltips and popovers is tricky in React.
 * 
 * Given an element, such as a button, and a tooltip element describing it, Popper will automatically put the tooltip in the right place near the button.
 * 
 * It will position any UI element that "pops out" from the flow of your document and floats near a target element. The most common example is a tooltip, but it also includes popovers, drop-downs, and more.
 */

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
