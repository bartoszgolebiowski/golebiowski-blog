import Link from "next/link";

const BasicLayout = (page) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          padding: "0 2rem",
        }}
      >
        <h1>
          <Link href="/">Golebiowski blog</Link>
        </h1>
      </header>
      <main
        style={{
          flex: "1 1 auto",
          flexDirection: "row",
          maxWidth: 768,
          margin: "0 auto",
          padding: "2rem 0",
        }}
      >
        {page}
      </main>
    </div>
  );
};

export default BasicLayout;
