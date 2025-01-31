import { ButtonInfo } from '@/components/components/Button/ButtonInfo';
import { ButtonLogin } from '@/components/components/Button/ButtonLogin';
import InputColeta from '@/components/components/Input/InputColeta';
import React from 'react';
import { Checkbox } from '@shadcn/ui';


function ColetaDeDados() {
  return (
    <div className="flex flex-col bg-[#141414] text-white min-h-screen">

      <div className="w-full h-36 flex justify-center items-center bg-[#141414]">
        <h1 className="text-neutral-200 text-4xl font-Montserrat">Coleta de Dados</h1>
      </div>

      <div className="w-full flex-grow flex justify-center items-center bg-[#181818]">

        <div className='sm:w-3/5 pb-16'>

            <InputColeta type="name" className=' bg-neutral-800 mb-4'/>
            <InputColeta type="email" className=' bg-neutral-800 mb-4'/>
            <InputColeta type="instituição" className=' bg-neutral-800 mb-4'/>
            <InputColeta type="feedback" className=' bg-neutral-800 h-36'/>

            <p className='text-neutral-200 font-Montserrat text-sm p-6 mb-6'>Concordo com a coleta e uso dos meus dados</p>

            <ButtonLogin type="entrar" className='w-full'/>

        </div>
        

      </div> 
    </div>
  );
}

export default ColetaDeDados;