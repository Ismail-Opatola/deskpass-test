// @ts-nocheck
import "./App.css";
import ToolTip from "./components/bits/Tooltip";
import { useState } from "react";
import Button from "./components/bits/Button";
import Avatar from "./components/bits/Avatar";

function App() {
  const [direction, setDirection] = useState("left");

  /**
   * Tooltip placement handler - Control tooltip direction.
   * @param {string} direction - one of "left | top | right | bottom"
   */
  const handlePlacement = (direction) => setDirection(direction);
  /**
   * Change Tooltip direction to the left
   */
  const placeLeft = () => handlePlacement("left");
  /**
   * Change Tooltip direction to the right
   */
  const placeRight = () => handlePlacement("right");
  /**
   * Change Tooltip direction to the top
   */
  const placeTop = () => handlePlacement("top");
  /**
   * Change Tooltip direction to Bottom
   */
  const placeBottom = () => handlePlacement("bottom");

  return (
    <div className="App">
      <header className="App-header">
        <ToolTip title="Left Anchor" placement={direction}>
          <Button type="button" onClick={() => placeLeft()}>
            LEFT
          </Button>
        </ToolTip>
        <ToolTip title="Top Anchor" placement={direction}>
          <Button type="button" onClick={() => placeTop()}>
            TOP
          </Button>
        </ToolTip>
        <ToolTip
          title="Lorem ipsum dolor sit amet consectetur, adipisicing elit. Consequatur, adipisci eum maxime facere amet iste nisi, dolorum iure, dignissimos possimus reprehenderit porro officiis in corrupti voluptatem debitis cumque culpa ipsam?"
          placement={direction}
        >
          <Button type="button" onClick={() => placeRight()}>
            RIGHT
          </Button>
        </ToolTip>
        <ToolTip title="Bottom Anchor" placement={direction}>
          <Button type="button" onClick={() => placeBottom()}>
            BOTTOM
          </Button>
        </ToolTip>
        <ToolTip title="Tooltip with bubble" placement={direction} arrow>
          <Button type="button" onClick={() => placeBottom()}>
            Arrow
          </Button>
        </ToolTip>
        <ToolTip title="Main" placement={direction}>
          <Button variant="circle" type="button">
            DP
          </Button>
        </ToolTip>
        <ToolTip title="Menu" placement={direction}>
          <Button variant="circle" type="button">
            <svg
              className="icon"
              focusable="false"
              viewBox="0 0 24 24"
              aria-hidden="true"
              data-testid="MenuIcon"
            >
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
            </svg>
          </Button>
        </ToolTip>
        <ToolTip title="Notifications" placement={direction}>
          <Button variant="circle" type="button">
            <svg
              className="icon"
              focusable="false"
              viewBox="0 0 24 24"
              aria-hidden="true"
              data-testid="NotificationsIcon"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path>
            </svg>
          </Button>
        </ToolTip>
        <ToolTip title="John Doe" placement={direction}>
          <Button variant="circle" type="button">
            <Avatar
              title="John Doe"
              imgProps={{
                alt: "John Doe profile picture",
                src: "sample-image.jpg",
                className: "avatar-img",
              }}
            />
          </Button>
        </ToolTip>
        <ToolTip title="John Doe" placement={direction}>
          <Button variant="circle" type="button">
            <Avatar
              size="md"
              title="John Doe"
              imgProps={{
                alt: "John Doe profile picture",
                src: "sample-image.jpg",
                className: "avatar-img",
              }}
            />
          </Button>
        </ToolTip>
        <ToolTip title="John Doe" placement={direction}>
          <Button variant="circle" type="button">
            <Avatar
              size="lg"
              title="John Doe"
              imgProps={{
                alt: "John Doe profile picture",
                src: "sample-image.jpg",
                className: "avatar-img",
              }}
            />
          </Button>
        </ToolTip>
      </header>
    </div>
  );
}

export default App;
