<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide1.png?raw=true"/></p>

## Computability

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide2.png?raw=true"/></p>

<p>An interesting question for computer architects is what
capabilities must be included in the ISA?  When we studied
Boolean gates in Part 1 of the course, we were able to prove
that NAND were universal, <i>i.e.</i>, that we could implement
any Boolean function using only circuits constructed from NAND
gates.</p>

<p>We can ask the corresponding question of our ISA: is it
universal, <i>i.e.</i>, can it be used to perform any computation?
what problems can we solve with a von Neumann computer?  Can the
Beta solve any problem FSMs can solve?  Are there problems FSMs
can&#700;t solve?  If so, can the Beta solve those problems?  Do
the answers to these questions depend on the particular ISA?</p>

<p>To provide some answers, we need a mathematical model of
computation.  Reasoning about the model, we should be able to
prove what can be computed and what can&#700;t.  And hopefully
we can ensure that the Beta ISA has the functionality needed to
perform any computation.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide3.png?raw=true"/></p>

<p>The roots of computer science stem from the evaluation of many
alternative mathematical models of computation to determine the
classes of computation each could represent. An elusive goal was
to find a universal model, capable of representing *all*
realizable computations.  In other words if a computation could
be described using some other well-formed model, we should also
be able to describe the same computation using the universal
model.</p>

<p>One candidate model might be finite state machines (FSMs),
which can be built using sequential logic.  Using Boolean logic
and state transition diagrams we can reason about how an FSM
will operate on any given input, predicting the output with 100%
certainty.</p>

<p>Are FSMs the universal digital computing device?  In other
words, can we come up with FSM implementations that implement
all computations that can be solved by any digital device?</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide4.png?raw=true"/></p>

<p>Despite their usefulness and flexibility, there are common
problems that cannot be solved by any FSM.  For example, can we
build an FSM to determine if a string of parentheses (properly
encoded into a binary sequence) is well-formed?  A parenthesis
string is well-formed if the parentheses balance, <i>i.e.</i>,
for every open parenthesis there is a matching close parenthesis
later in the string.  In the example shown here, the input
string on the top is well-formed, but the input string on the
bottom is not.  After processing the input string, the FSM would
output a 1 if the string is well-formed, 0 otherwise.</p>

<p>Can this problem be solved using an FSM?  No, it can&#700;t.
The difficulty is that the FSM uses its internal state to encode
what it knows about the history of the inputs.  In the paren
checker, the FSM would need to count the number of unbalanced
open parens seen so far, so it can determine if future input
contains the required number of close parens.  But in a finite
state machine there are only a fixed number of states, so a
particular FSM has a maximum count it can reach.  If we feed the
FSM an input with more open parens than it has the states to
count, it won&#700;t be able to check if the input string is
well-formed.</p>

<p>The &#8220;finite-ness&#8221; of FSMs limits their ability to
solve problems that require unbounded counting.  Hmm, what other
models of computation might we consider? Mathematics to the
rescue, in this case in the form of a British mathematician
named Alan Turing.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide5.png?raw=true"/></p>

<p>In the early 1930&#700;s Alan Turing was one of many
mathematicians studying the limits of proof and computation.  He
proposed a conceptual model consisting of an FSM combined with a
infinite digital tape that could read and written under the
control of the FSM.  The inputs to some computation would be
encoded as symbols on the tape, then the FSM would read the
tape, changing its state as it performed the computation, then
write the answer onto the tape and finally halting.  Nowadays,
this model is called a Turing Machine (TM). Turing Machines,
like other models of the time, solved the &#8220;finite&#8221;
problem of FSMs.</p>

<p>So how does all this relate to computation? Assuming the
non-blank input on the tape occupies a finite number of adjacent
cells, it can be expressed as a large integer.  Just construct a
binary number using the bit encoding of the symbols from the
tape, alternating between symbols to the left of the tape head
and symbols to the right of the tape head.  Eventually all the
symbols will be incorporated into the (very large) integer
representation.</p>

<p>So both the input and output of the TM can be thought of as
large integers, and the TM itself as implementing an integer
function that maps input integers to output integers.</p>

<p>The FSM brain of the Turing Machine can be characterized by its
truth table.  And we can systematically enumerate all the
possible FSM truth tables, assigning an index to each truth
table as it appears in the enumeration.  Note that indices get
very large very quickly since they essentially incorporate all
the information in the truth table.  Fortunately we have a very
large supply of integers!</p>

<p>We&#700;ll use the index for a TM&#700;s FSM to identify the
TM as well.  So we can talk about TM 347 running on input 51,
producing the answer 42.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide6.png?raw=true"/></p>

<p>There are many other models of computation, each of which
describes a class of integer functions where a computation is
performed on an integer input to produce an integer answer.
Kleene, Post and Turing were all students of Alonzo Church at
Princeton University in the mid-1930&#700;s.  They explored
many other formulations for modeling computation: recursive
functions, rule-based systems for string rewriting, and the
lambda calculus.  They were all particularly intrigued with
proving the existence of problems unsolvable by realizable
machines.  Which, of course, meant characterizing the problems
that could be solved by realizable machines.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide7.png?raw=true"/></p>

<p>It turned out that each model was capable of computing
<i>exactly</i> the same set of integer functions!  This was
proved by coming up with constructions that translated the steps
in a computation between the various models.  It was possible to
show that if a computation could be described by one model, an
equivalent description exists in the other model.  This lead to
a notion of computability that was independent of the
computation scheme chosen.  This notion is formalized by
Church&#700;s Thesis, which says that every discrete function
computable by any realizable machine is computable by some
Turing Machine.  So if we say the function f(x) is computable,
that&#700;s equivalent to saying that there&#700;s a TM that
given x as an input on its tape will write f(x) as an output on
the tape and halt.</p>

<p>As yet there&#700;s no proof of Church&#700;s Thesis, but
it&#700;s universally accepted that it&#700;s true.  In
general <i>computable</i> is taken to mean
&#8220;computable by some TM&#8221;.</p>

<p>If you&#700;re curious about the existence of uncomputable
functions, please see the optional section at the end of this
lecture.</p>

## Universality

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide8.png?raw=true"/></p>

<p>Okay, we&#700;ve decided that Turing Machines can model any
realizable computation.  In other words for every computation we
want to perform, there&#700;s a (different) Turing Machine that
will do the job.  But how does this help us design a
general-purpose computer?  Or are there some computations that
will require a special-purpose machine no matter what?</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide9.png?raw=true"/></p>

<p>What we&#700;d like to find is a universal function U: it
would take two arguments, k and j, and then compute the result
of running $T_k$ on input j.  Is U computable, <i>i.e.</i>, is
there a universal Turing Machine $T_U$?  If so, then instead of
many ad-hoc TMs, we could just use $T_U$ to compute the results
for any computable function.</p>

<p>Surprise!  U is computable and $T_U$ exists.  If fact there are
infinitely many universal TMs, some quite simple - the smallest
known universal TM has 4 states uses 6 tape symbols.  A
universal machine is capable of performing any computation that
can be performed by any TM!</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide10.png?raw=true"/></p>

<p>What&#700;s going on here?  k encodes a <i>program</i>;
&#8212; a description of some arbitrary TM that performs a particular
computation.  j encodes the input data on which to perform that
computation.  $T_U$ <i>interprets</i> the program,
emulating the steps $T_k$ will take to process the input and
write out the answer.  The notion of interpreting a coded
representation of a computation is a key idea and forms the
basis for our stored program computer.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide11.png?raw=true"/></p>

<p>The Universal Turing Machine is the paradigm for modern
general-purpose computers.  Given an ISA we want to know if
it&#700;s equivalent to a universal Turing Machine.  If so, it
can emulate every other TM and hence compute any computable
function.</p>

<p>How do we show our computer is Turing Universal?  Simply
demonstrate that it can emulate some known Universal Turing
Machine.  The finite memory on actual computers will mean we can
only emulate UTM operations on inputs up to a certain size, but
within this limitation we can show our computer can perform any
computation that fits into memory.</p>

<p>As it turns out this is not a high bar: so long as the ISA has
conditional branches and some simple arithmetic, it will be
Turing Universal.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide12.png?raw=true"/></p>

<p>This notion of encoding a program in a way that allows it to be
data to some other program is a key idea in computer
science.</p>

<p>We often translate a program Px written to run on some abstract
high-level machine (eg, a program in C or Java) into, say, an
assembly language program Py that can be interpreted by our CPU.
This translation is called compilation.</p>

<p>Much of software engineering is based on the idea of taking a
program and using it as as component in some larger program.</p>

<p>Given a strategy for compiling programs, that opens the door to
designing new programming languages that let us express our
desired computation using data structures and operations
particularly suited to the task at hand.</p>

<p>So what have learned from the mathematicians&#700; work on
models of computation?  Well, it&#700;s nice to know that the
computing engine we&#700;re planning to build will be able to
perform any computation that can be performed on any realizable
machine.  And the development of the universal Turing Machine
model paved the way for modern stored-program computers.  The
bottom line: we&#700;re good to go with the Beta ISA!</p>

## Uncomputability

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide13.png?raw=true"/></p>

<p>We&#700;ve discussed computable functions.  Are there
uncomputable functions?</p>

<p>Yes, there are well-defined discrete functions that cannot be
computed by any TM, <i>i.e.</i>, no algorithm can compute f(x)
for arbitrary finite x in a finite number of steps.  It&#700;s
not that we don&#700;t know the algorithm, we can actually
prove that no algorithm exists.  So the finite memory
limitations of FSMs wasn&#700;t the only barrier as to whether
we can solve a problem.</p>

<p>The most famous uncomputable function is the so-called Halting
function.  When TMs undertake a computation there two possible
outcomes.  Either the TM writes an answer onto the tape and
halts, or the TM loops forever.  The Halting function tells
which outcome we&#700;ll get: given two integer arguments k and
j, the Halting function determines if the kth TM halts when
given a tape containing j as the input.</p>

<p align="center"><img style="height:450px;" src="lecture_slides/models/Slide14.png?raw=true"/></p>

<p>Let&#700;s quickly sketch an argument as to why the Halting
function is not computable.  Well, suppose it was computable,
then it would be equivalent to some TM, say $T_H$.</p>

<p>So we can use $T_H$ to build another TM, $T_N$ (the
&#8220;N&#8221; stands for nasty!) that processes its single
argument and either LOOPs or HALTs.  $T_N[X]$ is designed to
loop if TM X given input X halts.  And vice versa: $T_N[X]$
halts if TM X given input X loops.  The idea is that $T_N[X]$
does the opposite of whatever $T_X[X]$ does.  $T_N$ is easy to
implement assuming that we have $T_H$ to answer the &#8220;halts
or loops&#8221; question.</p>

<p>Now consider what happens if we give N as the argument to
$T_N$.  From the definition of $T_N$, $T_N[N]$ will LOOP if the
halting function tells us that $T_N[N]$ halts.  And $T_N[N]$
will HALT if the halting function tells us that $T_N[N]$ loops.
Obviously $T_N[N]$ can&#700;t both LOOP and HALT at the same
time!  So if the Halting function is computable and $T_H$
exists, we arrive at this impossible behavior for $T_N[N]$.
This tells us that $T_H$ cannot exist and hence that the Halting
function is not computable.</p>
