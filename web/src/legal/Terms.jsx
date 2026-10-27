import { Link } from 'react-router-dom';
import { LAST_UPDATED } from '../site';
import LegalPage from '../components/LegalPage';
import TraderLine from '../components/TraderLine';

const Terms = () => (
  <LegalPage title="Terms" updated={LAST_UPDATED}>
    <TraderLine />
    <h2>What Amara&apos;s Pick is</h2>
    <p>
      Amara&apos;s Pick is a free search of plus-size clothes, swimwear and activewear at other UK shops. We
      don&apos;t sell anything. When you buy, you buy from the shop, under the shop&apos;s own terms,
      prices, delivery and returns.
    </p>
    <h2>Accuracy</h2>
    <p>
      We read each shop&apos;s products once a night, and each item shows when it was checked. Shops
      change prices and stock all the time, so the shop&apos;s own page is always the final word. Our
      target is that 95 in 100 items we send you to are in stock in your size, and 98 in 100 have the
      right sizes. If something is wrong, please <Link to="/contact">tell us</Link>.
    </p>
    <h2>Links to shops</h2>
    <p>
      We aren&apos;t responsible for other sites&apos; content. How we earn money from links is on{' '}
      <Link to="/how-amaras-pick-makes-money">How Amara&apos;s Pick makes money</Link>.
    </p>
    <h2>Using Amara&apos;s Pick</h2>
    <p>
      You may use Amara&apos;s Pick for your own shopping. Please don&apos;t copy our listings in bulk or
      disrupt the site.
    </p>
    <h2>Our responsibility</h2>
    <p>
      Nothing here limits your rights under UK consumer law, or our liability where the law
      doesn&apos;t allow it to be limited. Otherwise, because Amara&apos;s Pick is free and the sale is between
      you and the shop, we aren&apos;t liable for losses from relying on a listing.
    </p>
    <h2>Law</h2>
    <p>These terms are governed by the law of England and Wales.</p>
  </LegalPage>
);

export default Terms;
