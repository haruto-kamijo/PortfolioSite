export default function RootLayout({children,}: {
  children:React.ReactNode;
}) {
  return(
    <html lang="ja">
    <body>
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <Nav />
        <main className={styles.main}>{children}</main>
      </div>
      <Footer />
    </div>
    </body>
    </html>
  );
}