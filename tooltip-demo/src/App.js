// @ts-nocheck
import "./App.css";
import { useState } from "react";
import Button from "./components/bits/Button";
import Avatar from "./components/bits/Avatar";
import Tooltip from "./components/bits/Tooltip";

function App() {
  const [direction, setDirection] = useState("left");

  /**
   * Tooltip placement handler - Control tooltip direction.
   * @param {string} direction - one of `left-start` | `left` | `left-end` | `top-start` | `top` | `top-end` | `right-start` | `right` | `right-end` | `bottom-start` | `bottom` | `bottom-end`
   */
  const handlePlacement = (e, direction) => {
    e.stopPropagation();
    setDirection(direction);
  };

  return (
    <div className="App">
      <section>
        <h5>Positioned tooltips</h5>
        <p>
          Click to switch <code>Tooltip</code> direction.
        </p>

        <div className="display-grid place-content-center">
          <div>
            <Tooltip title="Top Start Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "top-start")}
              >
                TOP-START
              </Button>
            </Tooltip>
            <Tooltip title="Top Anchor" placement={direction}>
              <Button type="button" onClick={(e) => handlePlacement(e, "top")}>
                TOP
              </Button>
            </Tooltip>
            <Tooltip title="Top End Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "top-end")}
              >
                TOP-END
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="display-grid justify-space-between grid-template-columns-1fr max-w-500 mx-auto">
          <div className="display-flex flex-direction-column align-start">
            <Tooltip title="Left Start Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "left-start")}
              >
                LEFT-START
              </Button>
            </Tooltip>
            <Tooltip title="Left Anchor" placement={direction}>
              <Button type="button" onClick={(e) => handlePlacement(e, "left")}>
                LEFT
              </Button>
            </Tooltip>
            <Tooltip title="Left Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "left-end")}
              >
                LEFT-END
              </Button>
            </Tooltip>
          </div>

          <div className="display-flex flex-direction-column align-end">
            <Tooltip title="Right Start Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "right-start")}
              >
                RIGHT-START
              </Button>
            </Tooltip>
            <Tooltip title="Right Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "right")}
              >
                RIGHT
              </Button>
            </Tooltip>
            <Tooltip title="Right End Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "right-end")}
              >
                RIGHT-END
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="display-grid place-content-center">
          <div>
            <Tooltip title="Bottom Start Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "bottom-start")}
              >
                BOTTOM-START
              </Button>
            </Tooltip>
            <Tooltip title="Bottom Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "bottom")}
              >
                BOTTOM
              </Button>
            </Tooltip>
            <Tooltip title="Bottom End Anchor" placement={direction}>
              <Button
                type="button"
                onClick={(e) => handlePlacement(e, "bottom-end")}
              >
                BOTTOM-END
              </Button>
            </Tooltip>
          </div>
        </div>
        <p>
          When overflow is detected, tooltip auto-flips the opposite direction
          of it wrapped element.
        </p>
      </section>
      <section>
        <h5>
          Arrow <code>Tooltip</code>
        </h5>
        <p>
          You can use the <code>arrow</code> prop to give the tooltip component
          an arrow indicating which element it refers to.
        </p>
        <Tooltip
          title="Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam consequatur autem, hic, numquam aspernatur atque architecto dolore illum praesentium repudiandae a, est quisquam nesciunt voluptatibus minima similique perspiciatis mollitia blanditiis?"
          placement={direction}
          arrow
        >
          <Button type="button">Arrow</Button>
        </Tooltip>
      </section>

      <section>
        <h5>Examples</h5>
        <p>
          More examples of <code>Tooltip</code> usecase.
        </p>
        <Tooltip title="Main" placement={direction} arrow>
          <Button variant="circle" type="button">
            DP
          </Button>
        </Tooltip>
        <Tooltip title="Menu" placement={direction} arrow>
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
        </Tooltip>
        <Tooltip title="Notifications" placement={direction} arrow>
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
        </Tooltip>
        <Tooltip title="John Doe" placement={direction} arrow>
          <Button variant="circle" type="button">
            <Avatar
              title="John Doe"
              imgProps={{
                alt: "John Doe profile picture",
                src: "sample-image.jpg",
              }}
            />
          </Button>
        </Tooltip>
        <Tooltip title="John Doe" placement={direction} arrow>
          <Button variant="circle" type="button">
            <Avatar
              size="md"
              title="John Doe"
              imgProps={{
                alt: "John Doe profile picture",
                src: "sample-image.jpg",
              }}
            />
          </Button>
        </Tooltip>
        <Tooltip title="John Doe" placement={direction} arrow>
          <Button variant="circle" type="button">
            <Avatar
              size="lg"
              title="John Doe"
              imgProps={{
                alt: "John Doe profile picture",
                src: "sample-image.jpg",
              }}
            />
          </Button>
        </Tooltip>
      </section>
    </div>
  );
}

export default App;
