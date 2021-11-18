import BasicLayout from "../components/basic-layout";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => BasicLayout(page));

  return getLayout(<Component {...pageProps} />);
}
