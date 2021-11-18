/** @jsxImportSource theme-ui */

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
        <h1>
          <Link href="/">Golebiowski blog</Link>
        </h1>
      </header>
      <main
        sx={{
          flex: "1 1 auto",
          flexDirection: "row",
          maxWidth: 768,
          margin: "0 auto",
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
