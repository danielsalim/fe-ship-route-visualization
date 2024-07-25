import { getS57LayersDispatch } from "./states/map/action";
import { Provider, useDispatch } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import store from './states'
import "./index.scss";

const Peta = React.lazy(() => import("./components/Peta.jsx"));

const App = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dispatch(getS57LayersDispatch()).then(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="w-full h-full">
      <React.Suspense fallback="Loading...">
        {!isLoading && (
          <Peta />
        )}
      </React.Suspense>
      <ToastContainer />
    </div>
  );
};

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById("app")
);