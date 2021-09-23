// @ts-nocheck
import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

/**
 * Round Number helper function
 * @param {number} value
 * @returns {number}
 */
function round(value) {
  return Math.round(value * 1e5) / 1e5;
}

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const DefaultStyle = styled.div`
  position: absolute;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.9);
  border-radius: 4px;
  color: #fff;
  text-align: center;
  padding: 4px 8px;
  font-size: 0.57em;
  line-height: ${"".concat(round(14 / 10).toString(), "em")};
  max-width: 300;
  word-wrap: break-word;
  font-weight: medium;
  display: ${(props) => (props.visible ? "inline-block" : "none")};
  &:hover {
    display: inline-block;
  }
`;

// ----------
// Placements
// ----------

const Left = styled(DefaultStyle)`
  top: 0;
  right: 105%;
  width: 12em;
  margin: 0.5em 0.2em 0 0;

  &:after {
    /* If props arrow = {true}, set left arrow*/
    ${(props) =>
      props.arrow &&
      `
      content: " ";
      position: absolute;
      top: 50%;
      left: 100%; /* To the right of the tooltip */
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent transparent black;
      transform-origin: 0 0;
  `}
  }
`;
const Right = styled(DefaultStyle)`
  top: 0;
  left: 105%;
  width: 12em;
  margin: 0.5em 0 0 0.2em;

  &:after {
    /* If props arrow = {true}, set right arrow */
    ${(props) =>
      props.arrow &&
      `
      content: " ";
      position: absolute;
      top: 50%;
      right: 100%; /* To the left of the tooltip */
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent black transparent transparent;
  `}
  }
`;
const Top = styled(DefaultStyle)`
  left: 50%;
  bottom: 100%;
  width: 12em;
  margin-left: -6em; /* Use half of the width (12/2 = 6), to center the tooltip */

  &:after {
    /* If props arrow = {true}, set top arrow */
    ${(props) =>
      props.arrow &&
      `
      content: " ";
      position: absolute;
      top: 100%; /* At the bottom of the tooltip */
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: black transparent transparent transparent;
    `}
  }
`;
const Bottom = styled(DefaultStyle)`
  transform-origin: 0 100%;
  left: 50%;
  top: 100%;
  width: 12em;
  margin-top: 0.2em;
  margin-left: -6em; /* Use half of the width (12/2 = 6), to center the tooltip */

  &::after {
    /* If props arrow = {true}, set bottom arrow */
    ${(props) =>
      props.arrow &&
      `
      content: " ";
      position: absolute;
      bottom: 100%; /* At the top of the tooltip */
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent black transparent;
    `}
  }
`;

/**
 * Tooltip component
 * @param {object} children
 * @param {string} title
 * @param {string} placement
 * @param {boolean} arrow
 * @param {object} rest
 * @returns {JSX.Element}
 * ---
 * When activated, Tooltips display a text label identifying an element, such as a description of its function.
 *
 * * Use `title` prop to specify and display a text identifying an element, such as a description of its function.
 * 
 * * You can use the `placement` prop to change tooltip position. Tooltips has 4 placements choice:  `Left | Top | Right | Bottom`
 *
 * * You can use the `arrow` prop to give your tooltip an arrow indicating which element it refers to.
 */

const ToolTip = ({ children, title, placement, ...rest }) => {
  const [visible, setVisibile] = useState(false);

  const show = () => setVisibile(true);
  const hide = () => setVisibile(false);

  const Tip = ({ placement, ...rest }) => {
    if (placement === "left") {
      return <Left {...rest} />;
    }
    if (placement === "right") {
      return <Right {...rest} />;
    }
    if (placement === "top") {
      return <Top {...rest} />;
    }
    if (placement === "bottom") {
      return <Bottom {...rest} />;
    }

    return null;
  };

  return (
    <>
      <Wrapper onMouseEnter={() => show()} onMouseLeave={() => hide()}>
        <Tip placement={placement} visible={visible} {...rest}>
          {title}
        </Tip>
        {children}
      </Wrapper>
    </>
  );
};

ToolTip.propTypes = {
  children: PropTypes.element,
  title: PropTypes.string,
  arrow: PropTypes.bool,
  placement: PropTypes.oneOf(["bottom", "left", "right", "top"]),
};

export default ToolTip;
