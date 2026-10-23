import { Link } from 'react-router-dom';
import { LAST_UPDATED } from '../site';
import LegalPage from '../components/LegalPage';

const HowYxraMakesMoney = () => (
  <LegalPage title="How Yxra makes money" updated={LAST_UPDATED}>
    <p>
      Yxra is free for you, and always will be. You never pay us anything, and you buy from the shop
      itself, at the shop&apos;s own price.
    </p>
    <h2>Today: we earn nothing</h2>
    <p>
      Every link on Yxra today goes straight to the shop&apos;s own page. No shop pays us, and we
      earn nothing when you buy.
    </p>
    <h2>Later: commission from shops</h2>
    <p>
      We are applying to affiliate networks such as Awin. Once a shop agrees, its links become
      commission links: if you buy, the shop pays us a small share of the sale. You pay the same
      price. Every commission link will carry an <strong>Ad</strong> label next to it, so you can
      always tell.
    </p>
    <p>
      Later still, a shop may pay for its items to appear in a spot marked{' '}
      <strong>Sponsored</strong>. Those items follow the same rules as everything else: plus size,
      and in stock in your size. There are no Sponsored spots today.
    </p>
    <h2>How results are ordered</h2>
    <ul>
      <li>We only show items from the shops we search that are in stock in your UK size at our last check.</li>
      <li>They are ordered newest first: the items that most recently appeared at the shop come first.</li>
      <li>Commission never changes the order. A shop can&apos;t pay to rank higher in your results.</li>
      <li>We don&apos;t show star ratings or review counts.</li>
    </ul>
    <h2>Which shops</h2>
    <p>
      We don&apos;t search every plus-size shop. <Link to="/shops">Shops we search</Link> lists all of
      them, and the big names that aren&apos;t on Yxra yet.
    </p>
  </LegalPage>
);

export default HowYxraMakesMoney;
