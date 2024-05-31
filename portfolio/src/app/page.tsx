import Header from '@/app/(Components)/Header';
import FV from '@/app/(Components)/FV';
import Footer from '@/app/(Components)/Footer';

export default function Page() {
  return (
    <div className="flex h-screen p-0 bg-sky-100 double-gradation">
      <Header title="Kamijo Haruto"></Header>
      <div className="flex overflow-x-auto h-5/6 absolute top-12 mt-3">
        <FV></FV>
      </div>
      <Footer/>
    </div>
  );
}
