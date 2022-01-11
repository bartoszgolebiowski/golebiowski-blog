/** @jsxImportSource theme-ui */
import Image from "next/image";
import Link from "next/link";
import SubscribeFooter from "./subscribe-footer";

const BasicLayout = (page) => {
  return (
    <div
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <header
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          px: 4,
        }}
      >
        <h1 sx={{ position: "relative", minHeight: "5rem" }}>
          <Link href="/">
            <img
              src="/title.svg"
              height={"150"}
              sx={{ position: "absolute", cursor: "pointer" }}
            />
          </Link>
        </h1>
      </header>
      <main
        sx={{
          flex: "1 1 auto",
          flexDirection: "row",
          maxWidth: 768,
          "@media screen and (min-width: 768px)": {
            margin: "0 auto",
          },
          padding: "2rem",
        }}
      >
        {page}
      </main>
      <footer
        sx={{
          width: "100%",
        }}
      >
        <SubscribeFooter />
      </footer>
    </div>
  );
};

export default BasicLayout;
