import { useLocation, useOutlet } from "react-router-dom";

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div key={location.pathname} className="page-stage">
      {outlet}
    </div>
  );
}
