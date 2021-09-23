// @ts-nocheck
import styled from "styled-components";

const Button = styled.button`
  display: inline-flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  background-color: transparent;
  outline: 0px;
  border: 0px;
  margin: 0px;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  appearance: none;
  text-decoration: none;
  font-family: Roboto, Helvetica, Arial, sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.75;
  letter-spacing: 0.02857em;
  text-transform: uppercase;
  min-width: 64px;
  width: ${(props) => (props.variant === "circle" ? "64px" : "100%")};
  height: ${(props) => (props.variant === "circle" ? "64px" : "100%")};
  padding: ${(props) => (props.variant === "circle" ? "6px" : "6px 8px")};
  border-radius: ${(props) => (props.variant === "circle" ? "50%" : "4px")};
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  color: rgb(144, 202, 249);

  & svg {
    font-size: 1.75rem;
    text-align: center;
    width: 1em;
    height: 1em;
    display: inline-block;

    & path {
      fill: currentColor;
    }
  }

  &:hover {
    text-decoration: none;
    background-color: rgba(144, 202, 249, 0.08);
  }

  @media (hover: none) {
    &:hover {
      background-color: transparent;
    }
  }
`;

export default Button;
