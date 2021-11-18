import { useEffect } from "react";
import BasicLayout from "../components/basic-layout";
import "../styles/globals.css";

const useSubscriptionNotification = () => {
  useEffect(() => {
    !(function (c, h, i, m, p) {
      (m = c.createElement(h)),
        (p = c.getElementsByTagName(h)[0]),
        (m.async = 1),
        (m.src = i),
        p.parentNode.insertBefore(m, p);
    })(
      document,
      "script",
      "https://chimpstatic.com/mcjs-connected/js/users/c041361b6d107f67adf13f133/ab2edfe93295f5d932d0f26bd.js"
    );
    
  }, []);
};

export default function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => BasicLayout(page));
  useSubscriptionNotification();

  return getLayout(<Component {...pageProps} />);
}
