import React from 'react'

function Others() {
  return (
    <div>
        <form>
            <select className="select validator" required>
                <option disabled selected value="">Choose:</option>
                <option>Tabs</option>
                <option>Spaces</option>
            </select>
            <p className="validator-hint">Required</p>
            <button className="btn" type="submit">Submit form</button>
        </form>

        <p>.</p><p>.</p><p>.</p>

        <input type="date" className="input validator" required placeholder="Pick a date in 2025" 
            min="2025-01-01" max="2025-12-31"
            title="Must be valid URL" />
        <p className="validator-hint">Must be 2025</p>

        <p>.</p><p>.</p><p>.</p>

        <input type="tel" className="input validator tabular-nums" required placeholder="Phone" 
  pattern="[0-9]*" minLength="10" maxLength="10" title="Must be 10 digits" />
<p className="validator-hint">Must be 10 digits</p>

        <p>.</p><p>.</p><p>.</p>

        <input type="password" className="input validator" required placeholder="Password" minLength="8" 
  pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" 
  title="Must be more than 8 characters, including number, lowercase letter, uppercase letter" />
<p className="validator-hint">
  Must be more than 8 characters, including
  <br/>At least one number
  <br/>At least one lowercase letter
  <br/>At least one uppercase letter
</p>

<p>.</p><p>.</p><p>.</p>

<input className="input validator" type="email" required placeholder="mail@site.com" />
<div className="validator-hint">Enter valid email address</div>

<p>.</p><p>.</p><p>.</p>

<input type="text" className="input validator" required placeholder="Username" 
  pattern="[A-Za-z][A-Za-z0-9\-]*" minLength="3" maxLength="30" title="Only letters, numbers or dash" />
<p className="validator-hint">
  Must be 3 to 30 characters
  <br/>containing only letters, numbers or dash
</p>

<p>.</p><p>.</p><p>.</p>

{/* You can open the modal using document.getElementById('ID').showModal() method */}
<button className="btn" onClick={()=>document.getElementById('my_modal_3').showModal()}>open modal</button>
<dialog id="my_modal_3" className="modal">
  <div className="modal-box">
    <form method="dialog">
      {/* if there is a button in form, it will close the modal */}
      <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <h3 className="font-bold text-lg">Hello!</h3>
    <p className="py-4">Press ESC key or click on ✕ button to close</p>
  </div>
</dialog>

<p>.</p><p>.</p><p>.</p>

{/* The button to open modal */}
<label htmlFor="my_modal_7" className="btn">open modal</label>

{/* Put this part before </body> tag */}
<input type="checkbox" id="my_modal_7" className="modal-toggle" />
<div className="modal" role="dialog">
  <div className="modal-box">
    <h3 className="text-lg font-bold">Hello!</h3>
    <p className="py-4">This modal works with a hidden checkbox!</p>
  </div>
  <label className="modal-backdrop" htmlFor="my_modal_7">Close</label>
</div>

<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>



<p>.</p><p>.</p><p>.</p>

    </div>
  )
}

export default Others
