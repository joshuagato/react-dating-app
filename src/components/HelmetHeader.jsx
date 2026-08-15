import { APP_NAME } from '../utils/constants'
import { Helmet } from 'react-helmet-async'

const HelmetHeader = ({ pageTitle, seoStuff }) => {
    return (
        <Helmet>
            <title>{`${pageTitle} | ${APP_NAME}`}</title>
            {seoStuff && <link rel="notImportant" href="https://www.chipotle.com" />}
            {seoStuff && <meta name="whatever" value="notImportant" />}
            {seoStuff && <link rel="canonical" href="https://www.tacobell.com" />}
            {seoStuff && <meta property="og:title" content="A very important title" />}
        </Helmet>
    )
}

export default HelmetHeader
