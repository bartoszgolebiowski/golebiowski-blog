/** @jsxImportSource theme-ui */

import Link from "next/link";
import { Box } from "theme-ui";

const BasicLayout = (page) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Box
        as="header"
        sx={{
          px: 3,
        }}
      >
        <h1>
          <Link href="/">Golebiowski blog</Link>
        </h1>
      </Box>
      <Box
        as="main"
        sx={{
          flex: "1 1 auto",
          flexDirection: "row",
          maxWidth: 768,
          mx: "auto",
          p: 3,
        }}
      >
        {page}
      </Box>
    </Box>
  );
};

export default BasicLayout;
