import { Link } from 'react-router-dom';
import { LAST_UPDATED } from '../site';
import LegalPage from '../components/LegalPage';

const HowAmarasPickMakesMoney = () => (
  <LegalPage title="How Amara&apos;s Pick makes money" updated={LAST_UPDATED}>
    <p>
      Amara&apos;s Pick is free for you, and always will be. You never pay us anything, and you buy from the shop
      itself, at the shop&apos;s own price.
    </p>
    <h2>Today: we earn nothing</h2>
    <p>
      Every link on Amara&apos;s Pick today goes straight to the shop&apos;s own page. No shop pays us, and we
      earn nothing when you buy.
    </p>
    <h2>How results are ordered</h2>
    <ul>
      <li>
        We only show items from the shops we search that, at our last check, were in stock in at least
        one plus size: UK 18 and up, or bra band 38 and up.
      </li>
      <li>
        By default, items from shops with studio-style photos come first: photos of one shape, large,
        several per item, on a plain background. We check every shop&apos;s photos the same way, once a
        week. Within that, the shops take turns, in an order we mix once a day, so no single shop fills
        the page.
      </li>
      <li>You can sort by price, from low to high or high to low, and narrow the results by price and category.</li>
      <li>No shop can pay to rank higher in your results.</li>
      <li>We don&apos;t show star ratings or review counts.</li>
    </ul>
    <h2>Which shops</h2>
    <p>
      We don&apos;t search every plus-size shop. <Link to="/shops">Shops we search</Link> lists all of
      them.
    </p>
  </LegalPage>
);

export default HowAmarasPickMakesMoney;
