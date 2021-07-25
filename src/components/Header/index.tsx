import Link from 'next/link';
import commonStyles from '../../styles/common.module.scss';

export default function Header() {
  return(
    <header className={commonStyles.container}>
       <Link  href="/">
         <a>
          <img src="/logo.svg" alt="logo" />
         </a>
       </Link>    
    </header>
  )
}
