import { Link } from 'react-router-dom';
import { SITE } from '../site';
import LegalPage from '../components/LegalPage';
import TraderLine from '../components/TraderLine';

const Contact = () => {
  const mail = <a href={`mailto:${SITE.email}`}>{SITE.email}</a>;
  return (
    <LegalPage title="Contact">
      <p>Email {mail}. We aim to reply within two working days.</p>
      <ul>
        <li>
          <strong>Something wrong with an item?</strong> Tell us which one and what was wrong (sold
          out, wrong size, not plus size, broken link) and we will fix or hide it.
        </li>
        <li>
          <strong>Run a shop?</strong> See <Link to="/for-retailers">For Retailers</Link> to join or opt
          out.
        </li>
        <li>
          <strong>Your data.</strong> To use your rights or make a data protection complaint, see{' '}
          <Link to="/privacy">Privacy</Link>.
        </li>
      </ul>
      <TraderLine />
    </LegalPage>
  );
};

export default Contact;
