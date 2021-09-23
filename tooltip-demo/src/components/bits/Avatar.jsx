// @ts-nocheck
import styled from "styled-components";
import PropTypes from "prop-types";

const Wrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: Roboto, Helvetica, Arial, sans-serif;
  font-size: 1.25rem;
  line-height: 1;
  border-radius: 50%;
  overflow: hidden;
  user-select: none;

  ${(props) =>
    /* If prop size = "sm", set width and height of 30px */
    props.size === "sm"
      ? `
    width: 30px;
    height: 30px;
  `
      : /* If prop size = "md", set width and height of 40px */
      props.size === "md"
      ? `
    width: 40px;
    height: 40px;
  `
      : /* If prop size = "lg", set width and height of 60px */

      props.size === "lg"
      ? `
    width: 60px;
    height: 60px;
  `
      : /* default size, set width and height of 20px */
        `
    width: 20px;
    height: 20px;
  `}

  & img,
  & .avatar-img {
    width: 100%;
    height: 100%;
    text-align: center;
    object-fit: cover;
    color: transparent;
    text-indent: 10000px;
  }
`;

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
    <Wrapper size={size}>
      {imgProps.src ? (
        <img {...imgProps} alt={imgProps.alt} />
      ) : (
        <span className="avatar-img">{title}</span>
      )}
    </Wrapper>
  );
};

Avatar.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  title: PropTypes.string,
  imgProps: PropTypes.shape({
    alt: PropTypes.string,
    src: PropTypes.string,
    className: PropTypes.string,
  }),
};

export default Avatar;
