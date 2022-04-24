import styles from "./Button.module.css";
import PropTypes from "prop-types";
/**
 * Button Component
 * @param {string} variant `circle` | `default` - determine button shape.
 * @returns {JSX.Element}
 */
const Button = ({ children, variant, ...props }) => {
  return (
    // following the Block-Element-Modifier (BEM) classname convention
    <button
      className={`${styles.button} ${styles[`button-${variant}`]}`}
      {...props}
    >
      {children}
    </button>
  );
};

Button.defaultProps = {
  variant: "default",
};

Button.propTypes = {
  variant: PropTypes.oneOf(["cirle", "default"]),
};

export default Button;
