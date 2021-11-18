import { ThemeProvider } from "@theme-ui/theme-provider";
import BasicLayout from "../components/basic-layout";
import theme from "../components/theme";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => BasicLayout(page));

  return (
    <ThemeProvider theme={theme}>
      {getLayout(<Component {...pageProps} />)}
    </ThemeProvider>
  );
}
