import Header from '@/app/(Components)/Header';
import Footer from '@/app/(Components)/Footer';
import Aboutme from "@/app/(Components)/Aboutme";

export default function Page() {
  return (
      <div className="flex h-screen p-0 double-gradation">
        <Header title="Kamijo Haruto"></Header>
        <Aboutme></Aboutme>
        <Footer/>
      </div>
  );
}
