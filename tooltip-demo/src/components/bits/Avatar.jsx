import PropTypes from "prop-types";
import styles from "./Avatar.module.css";

/**
 * Avatar component
 * @param {string} size
 * @param {string} title
 * @param {object} imgProps
 * @returns {JSX.Element}
 * ---
 * A styled wrapper around user profile image
 *
 * * Use `size` to specify component size. supported sizes are `sm`, `md`, `lg`. Default size = `20px`
 * * Use `title` to label your Avatar
 * * Use the `imgProps` to specify img properties such as `alt`, `src`, `className`, `custom props`. Note: custom props will be forwarded to the image component.
 */

const Avatar = ({ size, title, imgProps }) => {
  return (
    <div className={`${styles.avatar} ${styles[`avatar-size--${size}`]}`}>
      {imgProps.src ? (
        <img {...imgProps} alt={imgProps.alt} />
      ) : (
        <span>{title}</span>
      )}
    </div>
  );
};

Avatar.defaultProps = {
  size: "default",
};

Avatar.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg", "default"]),
  title: PropTypes.string,
  imgProps: PropTypes.shape({
    alt: PropTypes.string,
    src: PropTypes.string,
    className: PropTypes.string,
  }),
};

export default Avatar;
