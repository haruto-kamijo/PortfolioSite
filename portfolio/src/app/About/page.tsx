import Header from '@/app/Components/Header';
import Footer from '@/app/Components/Footer';

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col p-6">
      <Header title="Portfolio Site"></Header>
      
      <Footer/>
    </div>
  );
}
