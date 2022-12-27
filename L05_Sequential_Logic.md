<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide1.png?raw=true"/></p>

## Digital State

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide2.png?raw=true"/></p>

<p>In the last lecture we learned how to build combinational logic
circuits given a functional specification that told us how
output values were related to the current values of the
inputs.</p>

<p>But here&#700;s a simple device we can&#700;t build with
combinational logic.  The device has a light that serves as the
output and push button that serves as the input.  If the light
is off and we push the button, the light turns on.  If the light
is on and we push the button, the light turns off.</p>

<p>What makes this circuit different from the combinational
circuits we&#700;ve discussed so far?  The biggest difference
is that the device&#700;s output is not function of the
device&#700;s *current* input value.  The behavior when the
button is pushed depends on what has happened in the past: odd
numbered pushes turn the light on, even numbered pushes turn the
light off.  The device is remembering whether the
last push was an odd push or an even push so it will behave
according to the specification when the next button push comes
along.  Devices that remember something about the history of
their inputs are said to have state.</p>

<p>The second difference is more subtle.  The push of the button
marks an event in time: we speak of the state before the push
(&#8220;the light is on&#8221;) and state after the push
(&#8220;the light is off&#8221;).  It&#700;s the transition of
the button from un-pushed to pushed that we&#700;re interested
in, not the whether the button is currently pushed or not.</p>

<p>The device&#700;s internal state is what allows it to produce
different outputs even though it receives the same input.  A
combinational device can&#700;t exhibit this behavior since its
outputs depends only on the current values of the input.
Let&#700;s see how we&#700;ll incorporate the notion of device
state into our circuitry.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide3.png?raw=true"/></p>

<p>We&#700;ll introduce a new abstraction of a memory component
that will store the current state of the digital system we want
to build.  The memory component stores one or more bits that
encode the current state of the system.  These bits are
available as digital values on the memory component&#700;s
outputs, shown here as the wire marked &#8220;Current
State.&#8221;</p>

<p>The current state, along with the current input values, are the
inputs to a block of combinational logic that produces two sets
of outputs.  One set of outputs is the next state of the device,
encoded using the same number of bits as the current state.  The
other set of outputs are the signals that serve as the outputs
of the digital system.  The functional specification for the
combinational logic (perhaps a truth table, or maybe a set of
Boolean equations) specifies how the next state and system
outputs are related to the current state and current inputs.</p>

<p>The memory component has two inputs: a LOAD control signal that
indicates when to replace the current state with the next state,
and a data input that specifies what the next state should be.
Our plan is to periodically trigger the LOAD control, which will
produce a sequence of values for the current state.  Each state
in the sequence is determined from the previous state and the
inputs at the time the LOAD was triggered.</p>

<p>Circuits that include both combinational logic and memory
components are called sequential logic.  The memory component
has a specific capacity measured in bits.  If the memory
component stores K bits, that puts an upper bound of $2^K$ on
the number of possible states since the state of the device is
encoded using the K bits of memory.</p>

<p>So, we&#700;ll need to figure out how to build a memory
component that can loaded with new values now and then.
That&#700;s the subject of this lecture.  We&#700;ll also need
a systematic way of designing sequential logic to achieve the
desired sequence of actions.  That&#700;s the subject of the
next lecture.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide4.png?raw=true"/></p>

<p>We&#700;ve been representing bits as voltages, so we might
consider using a capacitor to store a particular voltage.  The
capacitor is passive two-terminal device.  The terminals are
connected to parallel conducting plates separated by insulator.
Adding charge Q to one plate of the capacitor generates a
voltage difference V between the two plate terminals.  Q and V
are related by the capacitance C of the capacitor: Q = CV.</p>

<p>When we add charge to a capacitor by hooking a plate terminal
to higher voltage, that&#700;s called charging the
capacitor.  And when we take away charge by connecting
the plate terminal to a lower voltage, that&#700;s called
discharging the capacitor.</p>

<p>So here&#700;s how a capacitor-based memory device might work.
One terminal of the capacitor is hooked to some stable reference
voltage.  We&#700;ll use an NFET switch to connect the other
plate of the capacitor to a wire called the bit line.  The gate
of the NFET switch is connected to a wire called the word
line.</p>

<p>To write a bit of information into our memory device, drive the
bit line to the desired voltage (<i>i.e.</i>, a digital 0 or a
digital 1).  Then set the word line HIGH, turning on the NFET
switch.  The capacitor will then charge or discharge until it
has the same voltage as the bit line.  At this point, set the
word line LOW, turning off the NFET switch and isolating the
capacitor&#700;s charge on the internal plate.  In a perfect
world, the charge would remain on the capacitor&#700;s plate
indefinitely.</p>

<p>At some later time, to access the stored information, we first
charge the bit line to some intermediate voltage.  Then set the
word line HIGH, turning on the NFET switch, which connects the
charge on the bit line to the charge on the capacitor.  The
charge sharing between the bit line and capacitor will have some
small effect on the charge on the bit line and hence its
voltage.  If the capacitor was storing a digital 1 and hence was
at a higher voltage, charge will flow from the capacitor into
the bit line, raising the voltage of the bit line.  If the
capacitor was storing a digital 0 and was at lower voltage,
charge will flow from the bit line into the capacitor, lowering
the voltage of the bit line.  The change in the bit line&#700;s
voltage depends on the ratio of the bit line capacitance to C,
the storage capacitor&#700;s capacitance, but is usually quite
small.  A very sensitive amplifier, called a sense amp, is used
to detect that small change and produce a legal digital voltage
as the value read from the memory cell.</p>

<p>Whew! Reading and writing require a whole sequence of
operations, along with carefully designed analog electronics.
The good news is that the individual storage capacitors are
quite small &#8212; in modern integrated circuits we can fit
billions of bits of storage on relatively inexpensive chips
called dynamic random-access memories, or DRAMs for short.
DRAMs have a very low cost per bit of storage.</p>

<p>The bad news is that the complex sequence of operations
required for reading and writing takes a while, so access times
are relatively slow.  And we have to worry about carefully
maintaining the charge on the storage capacitor in the face of
external electrical noise.  The really bad news is that the NFET
switch isn&#700;t perfect and there&#700;s a tiny amount
leakage current across the switch even when it&#700;s
officially off.  Over time that leakage current can have a
noticeable impact on the stored charge, so we have to
periodically refresh the memory by reading and re-writing the
stored value before the leakage has corrupted the stored
information.  In current technologies, this has to be done every
10ms or so.</p>

<p>Hmm.  Maybe we can get around the drawbacks of capacitive
storage by designing a circuit that uses feedback to provide a
continual refresh of the stored information...</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide5.png?raw=true"/></p>

<p>Here&#700;s a circuit using combinational inverters hooked in
a positive feedback loop. If we set the input of one of the
inverters to a digital 0, it will produce a digital 1 on its
output.  The second inverter will then a produce a digital 0 on
its output, which is connected back around to the original
input.  This is a stable system and these digital values will be
maintained, even in the presence of noise, as long as this
circuitry is connected to power and ground.  And, of course,
it&#700;s also stable if we flip the digital values on the two
wires.  The result is a system that has two stable
configurations, called a bi-stable storage element.</p>

<p>Here&#700;s the voltage transfer characteristic showing how
$V_{\textrm{OUT}}$ and $V_{\textrm{IN}}$ of the two-inverter
system are related.  The effect of connecting the system&#700;s
output to its input is shown by the added constraint that
$V_{\textrm{IN}}$ equal $V_{\textrm{OUT}}$.  We can then
graphically solve for values of $V_{\textrm{IN}}$ and
$V_{\textrm{OUT}}$ that satisfy both constraints. There are
three possible solutions where the two curves intersect.</p>

<p>The two points of intersection at either end of the VTC are
stable in the sense that small changes in $V_{\textrm{IN}}$
(due, say, to electrical noise), have no effect on
$V_{\textrm{OUT}}$.  So the system will return to its stable
state despite small perturbations.</p>

<p>The middle point of intersection is what we call metastable.
In theory the system could balance at this
particular $V_{\textrm{IN}}/V_{\textrm{OUT}}$ voltage forever,
but the smallest perturbation will cause the voltages to quickly
transition to one of the stable solutions.  Since we&#700;re
planing to use this bi-stable storage element as our memory
component, we&#700;ll need to figure out how to avoid getting
the system into this metastable state.  More on this in the next
lecture.</p>

<p>Now let&#700;s figure out how to load new values into our
bi-stable storage element.</p>

## D Latch

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide6.png?raw=true"/></p>

<p>We can use a 2-to-1 multiplexer to build a settable storage
element.  Recall that a MUX selects as its output value the
value of one of its two data inputs.  The output of the MUX
serves as the state output of the memory component.  Internally
to the memory component we&#700;ll also connect the output of
the MUX to its D0 data input.  The MUX{}&#700;s D1 data input
will become the data input of the memory component.  And the
select line of the MUX will become the memory component&#700;s
load signal, here called the gate.</p>

<p>When the gate input is LOW, the MUX{}&#700;s output is looped
back through MUX through the D0 data input, forming the
bi-stable positive feedback loop discussed in the last section.
Note our circuit now has a cycle, so it no longer qualifies as a
combinational circuit.</p>

<p>When the gate input is HIGH, the MUX{}&#700;s output is
determined by the value of the D1 input, <i>i.e.</i>, the data
input of the memory component.</p>

<p>To load new data into the memory component, we set the gate
input HIGH for long enough for the Q output to become valid and
stable.  Looking at the truth table, we see that when G is 1,
the Q output follows the D input.  While the G input is HIGH,
any changes in the D input will be reflected as changes in the Q
output, the timing being determined by the tPD of the MUX.</p>

<p>Then we can set the gate input LOW to switch the memory
component into memory mode, where the stable Q value is
maintained indefinitely by the positive feedback loop as shown
in the first two rows of the truth table.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide7.png?raw=true"/></p>

<p>Our memory device is a called a D latch, or just a latch for
short, with the schematic symbol shown here.</p>

<p>When the latch&#700;s gate is HIGH, the latch is open and
information flows from the D input to the Q output.  When the
latch&#700;s gate is LOW, the latch is closed and in
memory mode, remembering whatever value was on the
D input when the gate transitioned from HIGH to LOW.</p>

<p>This is shown in the timing diagrams on the right.  The
waveforms show when a signal is stable, <i>i.e.</i>, a constant
signal that&#700;s either LOW or HIGH, and when a signal is
changing, shown as one or more transitions between LOW and
HIGH.</p>

<p>When G is HIGH, we can see Q changing to a new stable output
value no later than tPD after D reaches a new stable value.</p>

<p>Our theory is that after G transitions to a LOW value, Q will
stay stable at whatever value was on D when G made the HIGH to
LOW transition.  But, we know that in general, we can&#700;t
assume anything about the output of a combinational device until
tPD after the input transition &#8212; the device is allowed to
do whatever it wants in the interval between tCD and tPD after
the input transition.  But how will our memory work if the
1-to-0 transition on G causes the Q output to become invalid for
a brief interval?  After all it&#700;s the value on the Q
output we&#700;re trying to remember!  We&#700;re going to
have ensure that a 1-to-0 transition on G doesn&#700;t affect
the Q output.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide8.png?raw=true"/></p>

<p>That&#700;s why we specified a lenient MUX for our memory
component.  The truth table for a lenient MUX is shown here.
The output of a lenient MUX remains valid and stable even after
an input transition under any of the following three
conditions.</p>

<p>(1) When we&#700;re loading the latch by setting G HIGH, once
the D input has been valid and stable for tPD, we are guaranteed
that the Q output will be stable and valid with the same value
as the D input, independently of Q&#700;s initial value.</p>

<p>Or (2) If both Q and D are valid and stable for tPD, the Q
output will be unaffected by subsequent transitions on the G
input.  This is the situation that will allow us to have a
1-to-0 transition on G without contaminating the Q output.</p>

<p>Or, finally, (3) if G is LOW and Q has been stable for at least
tPD, the output will be unaffected by subsequent transitions on
the D input.</p>

<p>Does lenience guarantee a working latch?  Well, only if
we&#700;re careful about ensuring that signals are stable at
the right times so we can leverage the lenient behavior of the
MUX.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide9.png?raw=true"/></p>

<p>Here are the steps we need to follow in order to ensure the
latch will work as we want.</p>

<p>First, while the G input is HIGH, set the D input to the value
we wish store in the latch. Then, after tPD, we&#700;re
guaranteed that value will be stable and valid on the Q output.
This is condition (1) from the previous slide.</p>

<p>Now we wait another tPD so that the information about the new
value on the Q&#700; input propagates through the internal
circuitry of the latch.  Now, both D *and* Q&#700; have been
stable for at least tPD, giving us condition (2) from the
previous slide.</p>

<p>So if D is stable for 2*tPD, transitions on G will not affect
the Q output.  This requirement on D is called the setup time of
the latch: it&#700;s how long D must be stable and valid before
the HIGH-to-LOW transition of G.</p>

<p>Now we can set G to LOW, still holding D stable and valid.
After another tPD to allow the new G value to propagate through
the internal circuitry of the latch, we&#700;ve satisfied
condition (3) from the previous slide, and the Q output will be
unaffected by subsequent transitions on D.</p>

<p>This further requirement on D&#700;s stability is called the
hold time of the latch: it&#700;s how long after the transition
on G that D must stay stable and valid.</p>

<p>Together the setup and hold time requirements are called the
dynamic discipline, which must be followed if the latch is to
operate correctly.</p>

<p>In summary, the dynamic discipline requires that the D input be
stable and valid both both before and after a transition on G.
If our circuit is designed to obey the dynamic discipline, we
can guarantee that this memory component will reliably store the
information on D when the gate makes a HIGH-to-LOW
transition.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide10.png?raw=true"/></p>

<p>Let&#700;s try using the latch as the memory component in our
sequential logic system.</p>

<p>To load the encoding of the new state into the latch, we open
the latch by setting the latch&#700;s gate input HIGH, letting
the new value propagate to the latch&#700;s Q output, which
represents the current state.  This updated value propagates
through the combinational logic, updating the new state
information.  Oops, if the gate stays HIGH too long, we&#700;ve
created a loop in our system and our plan to load the latch with
new state goes awry as the new state value starts to change
rapidly as information propagates around and around the
loop.</p>

<p>So to make this work, we need to carefully time the interval
when G is HIGH.  It has to be long enough to satisfy the
constraints of the dynamic discipline, but it has to be short
enough that the latch closes again before the new state
information has a chance to propagate all the way around the
loop.</p>

<p>Hmm.  I think Mr. Blue is right: this sort of tricky system
timing would likely be error-prone since the exact timing of
signals is almost impossible to guarantee.  We have upper and
lower bounds on the timing of signal transitions but no
guarantees of exact intervals.  To make this work, we want to a
load signal that marks an instant in time, not an interval.</p>

## D Register

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide11.png?raw=true"/></p>

<p>Here&#700;s an analogy that will help us understand
what&#700;s happening and what we can do about it.  Imagine a
line cars waiting at a toll booth gate.  The sequence of cars
represents the sequence of states in our sequential logic and
the gated toll both represents the latch.</p>

<p>Initially the gate is closed and the cars are waiting patiently
to go through the toll booth. When the gate opens, the first car
proceeds out of the toll both.  But you can see that the timing
of when to close the gate is going to be tricky.  It has to be
open long enough for the first car to make it through, but not
too long lest the other cars also make it through.  This is
exactly the issue we faced with using the latch as our memory
component in our sequential logic.</p>

<p>So how do we ensure only one car makes it through the open
gate?</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide12.png?raw=true"/></p>

<p>One solution is to use <i>two</i> gates!  Here&#700;s the plan:
Initially Gate 1 is open allowing exactly one car to enter the
toll booth and Gate 2 is closed.  Then at a particular point in
time, we close Gate 1 while opening Gate 2.  This lets the car
in the toll booth proceed on, but prevents any other car from
passing through.  We can repeat this two-step process to deal
with each car one-at-time.  The key is that at no time is there
a path through both gates.</p>

<p>This is the same arrangement as the escapement mechanism in a
mechanical clock.  The escapement ensures that the gear attached
to the clock&#700;s spring only advances one tooth at a time,
preventing the spring from spinning the gear wildly causing a
whole day to pass at once!</p>

<p>If we observed the toll booth&#700;s output, we would see a
car emerge shortly after the instant in time when Gate 2 opens.
The next car would emerge shortly after the next time Gate 2
opens, and so on.  Cars would proceed through the toll booth at
a rate set by the interval between Gate 2 openings.</p>

<p>Let&#700;s apply this solution to design a memory component
for our sequential logic.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide13.png?raw=true"/></p>

<p>Taking our cue from the 2-gate toll both, we&#700;ll design a
new component, called a D register, using two back-to-back
latches.  The load signal for a D register is typically called
the register&#700;s clock, but the
register&#700;s D input and Q output play the same roles as
they did for the latch.</p>

<p>First we&#700;ll describe the internal structure of the D
register, then we&#700;ll describe what it does and look in
detail at how it does it.</p>

<p>The D input is connected to what we call the input latch and
the Q output is connected to the output latch.</p>

<p>Note that the clock signal is inverted before it&#700;s
connected to the gate input of the input latch.  So when the
input latch is open, the output latch is closed, and vice versa.  This
achieves the escapement behavior we saw on the previous slide:
at no time is there active path from the register&#700;s D
input to the register&#700;s Q output.</p>

<p>The delay introduced by the inverter on the clock signal might
give us cause for concern.  When there&#700;s a rising 0-to-1
transition on the clock signal, might there be a brief interval
when the gate signal is HIGH for both latches since there will
be a small delay before the inverter&#700;s output transitions
from 1 to 0?  Actually the inverter isn&#700;t necessary: Mr
Blue is looking at a slightly different latch schematic where
the latch is open when G is LOW and closed when G is high.  Just
what we need for the input latch!</p>

<p>By the way, you&#700;ll sometimes hear a register called a
flip-flop because of the bistable nature of the positive
feedback loops in the latches.</p>

<p>That&#700;s the internal structure of the D register.  In the
next section we&#700;ll take a step-by-step tour of the
register in operation.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide14.png?raw=true"/></p>

<p>We&#700;ll get a good understanding of how the register
operates as we follow the signals through the circuit.</p>

<p>The overall operation of the register is simple: At the rising
0-to-1 transition of the clock input, the register samples the
value of the D input and stores that value until the next rising
clock edge.  The Q output is simply the value stored in the
register. Let&#700;s see how the register implements this
functionality.</p>

<p>The clock signal is connected to the gate inputs of the input
and output latches.  Since all the action happens when the clock
makes a transition, it&#700;s those events we&#700;ll focus
on.  The clock transition from LOW to HIGH is called the rising
edge of the clock.  And its transition from HIGH to LOW is
called the falling edge.  Let&#700;s start by looking the
operation of the input latch and its output signal, which is
labeled STAR in the diagram.</p>

<p>On the rising edge of the clock, the input latch goes from
open to closed, sampling the value on its input and entering
memory mode.  The sampled value thus becomes the output of the
latch as long as the latch stays closed.  You can see that the
STAR signal remains stable whenever the clock signal is
high.</p>

<p>On the falling edge of the clock the input latch opens and its
output will then reflect any changes in the D input, delayed by
the tPD of the latch.</p>

<p>Now let&#700;s figure out what the output latch is doing.  It&#700;s
output signal, which also serves as the output of D register, is
shown as the bottom waveform.  On the rising edge of the clock
the output latch opens and its output will follow the value of
the STAR signal.  Remember though that the STAR signal is stable
while the clock is HIGH since the input latch is closed, so the
Q signal is also stable after an initial transition if value
saved in the output latch is changing.</p>

<p>At the falling clock edge, the output latch goes from open to
closed, sampling the value on its input and entering memory
mode.  The sampled value then becomes the output of the output
latch as long as the latch stays closed.  You can see that that
the Q output remains stable whenever the clock signal is
LOW.</p>

<p>Now let&#700;s just look at the Q signal by itself for a
moment.  It only changes when the output latch opens at the
rising edge of the clock.  The rest of the time either the input
to output latch is stable or the output latch is closed.  The
change in the Q output is triggered by the rising edge of the
clock, hence the name positive-edge-triggered D
register.</p>

<p>The convention for labeling the clock input in the schematic
icon for an edge-triggered device is to use a little triangle.
You can see that here in the schematic symbol for the D
register.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide15.png?raw=true"/></p>

<p>There is one tricky problem we have to solve when designing the
circuitry for the register.  On the falling clock edge, the
output latch transitions from open to closed and so its input
(the STAR signal) must meet the setup and hold times of the
output latch in order to ensure correct operation.</p>

<p>The complication is that the input latch opens at the same
time, so the STAR signal may change shortly after the clock
edge.  The contamination delay of the input latch tells us how
long the old value will be stable after the falling clock edge.
And the hold time on the output latch tells us how long it has to
remain stable after the falling clock edge.</p>

<p>So to ensure correct operation of the output latch, the
contamination delay of the input latch has to be greater than
or equal to the hold time of the output latch.  Doing the
necessary analysis can be a bit tricky since we have to consider
manufacturing variations as well as environmental factors such
as temperature and power supply voltage.  If necessary, extra
gate delays (<i>e.g.</i>, pairs of inverters) can be added
between the input and output latches to increase the
contamination delay on the output latch&#700;s input relative to the
falling clock edge.  Note that we can only solve output latch
hold time issues by changing the design of the circuit.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide16.png?raw=true"/></p>

<p>Here&#700;s a summary of the timing specifications for a D
register.</p>

<p>Changes in the Q signal are triggered by a rising edge on the
clock input.  The propagation delay $t_{\textrm{PD}}$ of the
register is an upper bound on the time it takes for the Q output
to become valid and stable after the rising clock edge.</p>

<p>The contamination delay of the register is a lower bound on the
time the previous value of Q remains valid after the rising
clock edge.</p>

<p>Note that both $t_{\textrm{CD}}$ and $t_{\textrm{PD}}$ are
measured relative to the rising edge of the clock.  Registers
are designed to be lenient in the sense that if the previous
value of Q and the new value of Q are the same, the stability of
the Q signal is guaranteed during the rising clock edge.  In
other words, the $t_{\textrm{CD}}$ and $t_{\textrm{PD}}$
specifications only apply when the Q output actually
changes.</p>

<p>In order to ensure correct operation of the input latch, the
register&#700;s D input must meet the setup and hold time
constraints for the input latch.  So the following two
specifications are determined by the timing of the input
latch.</p>

<p>$t_{\textrm{SETUP}}$ is the amount of time that the D input
must be valid and stable before the rising clock edge and
$t_{\textrm{HOLD}}$ is the amount of time that D must be valid
and stable after the rising clock.  This region of stability
surrounding the clock edge ensures that we&#700;re obeying the
dynamic discipline for the input latch.</p>

<p>So when you use a D register component from a
manufacturer&#700;s gate library, you&#700;ll need to look up
these four timing specifications in the register&#700;s data
sheet in order to analyze the timing of your overall circuit.
We&#700;ll see how this analysis is done in the next
section.</p>

## Sequential Circuit Timing

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide17.png?raw=true"/></p>

<p>In this course, we have a specific plan on how we&#700;ll use
registers in our designs, which we call the single-clock
synchronous discipline.</p>

<p>Looking at the sketch of a circuit on the left, we see that it
consists of registers &#8212; the rectangular icons with the
edge-triggered symbol &#8212; and combinational logic circuits,
shown here as little clouds with inputs and outputs.</p>

<p>Remembering that there is no combinational path between a
register&#700;s input and output, the overall circuit has no
combinational cycles.  In other words, paths from system inputs
and register outputs to the inputs of registers never visit the
same combinational block twice.</p>

<p>A single periodic clock signal is shared among all the clocked
devices.  Using multiple clock signals is possible, but
analyzing the timing for signals that cross between clock
domains is quite tricky, so life is much simpler when all
registers use the same clock.</p>

<p>The details of which data signals change when are largely
unimportant.  All that matters is that signals hooked to
register inputs are stable and valid for long enough to meet the
registers&#700; setup time.  And, of course, stay stable long
enough to meet the registers&#700; hold time.</p>

<p>We can guarantee that the dynamic discipline is obeyed by
choosing the clock period to be greater then the
$t_{\textrm{PD}}$ of every path from register outputs to
register inputs, plus, of course, the registers&#700; setup
time.</p>

<p>A happy consequence of choosing the clock period in this way is
that at the moment of the rising clock edge, there are no other
noise-inducing logic transitions happening anywhere in the
circuit.  Which means there should be no noise problems when we
update the stored state of each register.</p>

<p>Our next task is to learn how to analyze the timing of a
single-clock synchronous system.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide18.png?raw=true"/></p>

<p>Here&#700;s a model of a particular path in our synchronous
system.  A large digital system will have many such paths and we
have to do the analysis below for each one in order to find the
path that will determine the smallest workable clock period.  As
you might suspect, there are computed-aided design programs that
will do these calculations for us.</p>

<p>There&#700;s an upstream register, whose output is connected
to a combinational logic circuit which generates the input
signal, labeled STAR, to the downstream register.</p>

<p>Let&#700;s build a carefully-drawn timing diagram showing when
each signal in the system changes and when it is stable.</p>

<p>The rising edge of the clock triggers the upstream register,
whose output (labeled $Q_{\textrm{R1}}$) changes as specified by
the contamination and propagation delays of the register.
$Q_{\textrm{R1}}$ maintains its old value for at least the
contamination delay of REG1, and then reaches its final stable
value by the propagation delay of REG1.  At this point
$Q_{\textrm{R1}}$ will remain stable until the next rising clock
edge.</p>

<p>Now let&#700;s figure out the waveforms for the output of the
combinational logic circuit, marked with a red star in the
diagram.  The contamination delay of the logic determines the
earliest time STAR will go invalid measured from when
$Q_{\textrm{R1}}$ went invalid.  The propagation delay of the
logic determines the latest time STAR will be stable measured
from when $Q_{\textrm{R1}}$ became stable.</p>

<p>Now that we know the timing for STAR, we can determine whether
STAR will meet the setup and hold times for the downstream
register REG2.  Time t1 measures how long STAR will stay valid
after the rising clock edge.  t1 is the sum of REG1&#700;s
contamination delay and the logic&#700;s contamination delay.
The HOLD time for REG2 measures how long STAR has to stay valid
after the rising clock edge in order to ensure correct
operation.  So t1 has to be greater than or equal to the HOLD
time for REG2.</p>

<p>Time t2 is the sum of the propagation delays for REG1 and the
logic, plus the SETUP time for REG2.  This tells us the earliest
time at which the next rising clock edge can happen and still
ensure that the SETUP time for REG2 is met.  So t2 has to be
less than or equal to the time between rising clock edges,
called the clock period or tCLK.  If the next rising clock
happens before t2, we&#700;ll be violating the dynamic
discipline for REG2.</p>

<p>So we have two inequalities that must be satisfied for every
register-to-register path in our digital system.  If either
inequality is violated, we won&#700;t be obeying the dynamic
discipline for REG2 and our circuit will not be guaranteed to
work correctly.</p>

<p>Looking at the inequality involving tCLK, we see that the
propagation delay of the upstream register and setup time for
the downstream register take away from the time available useful
work performed by the combinational logic.  Not surprisingly,
designers try to use registers that minimize these two
times.</p>

<p>What happens if there&#700;s no combinational logic between
the upstream and downstream registers?  This happens when
designing shift registers, digital delay lines, etc.  Well, then
the first inequality tells us that the contamination delay of
the upstream register had better be greater than or equal to the
hold time of the downstream register.  In practice,
contamination delays are smaller than hold times, so in general
this wouldn&#700;t be the case.  So designers are often
required to insert dummy logic, <i>e.g.</i>, two inverters in
series, in order to create the necessary contamination
delay.</p>

<p>Finally we have to worry about the phenomenon called clock
skew, where the clock signal arrives at one register before it
arrives at the other.  We won&#700;t go into the analysis here,
but the net effect is to increase the apparent setup and hold
times of the downstream register, assuming we can&#700;t
predict the sign of the skew.</p>

<p>The clock period, tCLK, characterizes the performance of our
system.  You may have noticed that Intel is willing to sell you
processor chips that run at different clock
frequencies, <i>e.g.</i>, a 1.7 GHz processor vs. a 2 GHz
processor.  Did you ever wonder how those chips are different?
As is turns out they&#700;re not!  What&#700;s going on is
that variations in the manufacturing process mean that some
chips have better tPDs than others.  On fast chips, a smaller
tPD for the logic means that they can have a smaller tCLK and
hence a higher clock frequency.  So Intel manufactures many
copies of the same chip, measures their tPDs and selects the
fast ones to sell as higher-performance parts.  That&#700;s
what it takes to make money in the chip biz!</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide19.png?raw=true"/></p>

<p>Using a D register as the memory component in our sequential
logic system works great!  At each rising edge of the clock, the
register loads the new state, which then appears at the
register&#700;s output as the current state for the rest of the
clock period.  The combinational logic uses the current state
and the value of the inputs to calculate the next state and the
values for the outputs.  A sequence of rising clock edges and
inputs will produce a sequence of states, which leads to a
sequence of outputs.  In the next lecture we&#700;ll introduce
a new abstraction, finite state machines, that will make it easy
to design sequential logic systems.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide20.png?raw=true"/></p>

<p>Let&#700;s use the timing analysis techniques we&#700;ve
learned on the sequential logic system shown here.  The timing
specifications for the register and combinational logic are as
shown.  Here are the questions we need to answer.</p>

<p>The contamination delay of the combinational logic isn&#700;t
specified.  What does it have to be in order for the system to
work correctly?  Well, we know that the sum of register and
logic contamination delays has to be greater than or equal to
the hold time of the register.  Using the timing parameters we
do know along with a little arithmetic tells us that the
contamination delay of the logic has to be at least 1 ns.</p>

<p>What is the minimum value for the clock period tCLK? The second
timing inequality from the previous section tells us that tCLK
has be greater than than the sum of the register and logic
propagation delays plus the setup time of the register.  Using
the known values for these parameters gives us a minimum clock
period of 10ns.</p>

<p>What are the timing constraints for the Input signal relative
to the rising edge of the clock?  For this we&#700;ll need a
diagram!  The Next State signal is the input to the register so
it has to meet the setup and hold times as shown here.  Next we
show the Input signal and how the timing of its transitions
affect to the timing of the Next State signal.  Now it&#700;s
pretty easy to figure out when Input has to be stable before the
rising edge of the clock, <i>i.e.</i>, the setup time for
Input. The setup time for Input is the sum of propagation delay
of the logic plus the setup time for the register, which we
calculate as 7ns.  In other words, if the Input signal is stable
at least 7ns before the rising clock edge, then Next State will
be stable at least 2ns before the rising clock edge and hence
meet the register&#700;s specified setup time.</p>

<p>Similarly, the hold time of Input has to be the hold time of
the register minus the contamination delay of the logic, which
we calculate as 1 ns.  In other words, if Input is stable at
least 1 ns after the rising clock edge, then Next State will be
stable for another 1 ns, <i>i.e.</i>, a total of 2 ns after the
rising clock edge.  This meets the specified hold time of the
register.</p>

<p>This completes our introduction to sequential logic.  Pretty
much every digital system out there is a sequential logic system
and hence is obeying the timing constraints imposed by the
dynamic discipline.  So next time you see an ad for a 1.7 GHz
processor chip, you&#700;ll know where the &#8220;1.7&#8221;
came from!</p>

## Summary

<p align="center"><img style="height:450px;" src="lecture_slides/sequential/Slide21.png?raw=true"/></p>
