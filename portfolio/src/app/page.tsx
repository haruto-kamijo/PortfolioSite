import Header from '@/app/(Components)/Header';
import FV from '@/app/(Components)/FV';
import Footer from '@/app/(Components)/Footer';

export default function Page() {
  return (
    <div className="flex h-screen p-0 bg-sky-100 double-gradation">
      <Header title="Kamijo Haruto"></Header>
      <FV></FV>
      <Footer/>
    </div>
  );
}
