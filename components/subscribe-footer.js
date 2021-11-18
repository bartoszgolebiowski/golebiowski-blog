import { Button, Box } from "theme-ui";

export default function SubscribeFooter() {
  return (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <h1>
        Sign up for our newsletter to get the latest news and updates from us.
      </h1>
      <hr />
      <Box sx={{ display: "flex", justifyContent: "space-evenly" }}>
        <form
          action="https://bgolebiowski.us20.list-manage.com/subscribe/post?u=c041361b6d107f67adf13f133&amp;id=977b0e07b6"
          method="post"
          target="_blank"
        >
          <Button
            type="submit"
            sx={{
              mt: 1,
              width: "13rem",
              alignSelf: "center",
              fontFamily: "body",
              fontSize: "2rem",
            }}
          >
            Subscribe
          </Button>
        </form>
        <form
          action="https://us20.list-manage.com/contact-form?u=c041361b6d107f67adf13f133&form_id=a118ddd1369cdcc1e0920abaab1c73c1"
          method="post"
          target="_blank"
        >
          <Button
            type="submit"
            sx={{
              mt: 1,
              width: "13rem",
              alignSelf: "center",
              fontFamily: "body",
              fontSize: "2rem",
            }}
          >
            Contact me
          </Button>
        </form>
      </Box>
    </Box>
  );
}
