import styles from "./Button.module.css";

const Button = ({ children, variant, ...props }) => {
  return (
    // following the Block-Element-Modifier (BEM) classname convention
    <button className={`${styles.button} ${styles[`button-${variant}`]}`} {...props}>
      {children}
    </button>
  );
};

Button.defaultProps = {
  variant: "default",
};

export default Button;
