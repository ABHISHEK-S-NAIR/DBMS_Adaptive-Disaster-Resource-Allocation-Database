import PropTypes from 'prop-types';
import './PageHeader.css';

const PageHeader = ({ title, subtitle, actions }) => (
  <header className="page-header">
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
    <div className="page-header__actions">{actions}</div>
  </header>
);

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
};

PageHeader.defaultProps = {
  subtitle: '',
  actions: null,
};

export default PageHeader;
