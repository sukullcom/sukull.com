# 📐 LaTeX Math Support in Challenges

Sukull.com now supports **LaTeX mathematical expressions** in all challenge types! You can write beautiful mathematical equations in both **question text** and **option text** across all challenge types.

## 🚀 **Supported Locations**

- ✅ **Challenge Questions** (all types)
- ✅ **Multiple Choice Options** (SELECT, ASSIST, TIMER_CHALLENGE)
- ✅ **Match Pairs Text** (MATCH_PAIRS)
- ✅ **Fill Blank Content** (FILL_BLANK)
- ✅ **Drag & Drop Items** (DRAG_DROP)
- ✅ **Sequence Items** (SEQUENCE)
- ✅ **Admin Preview** (Course Builder)

## 📝 **LaTeX Syntax**

### **Inline Math** (within text)
Use `$...$` or `\(...\)` for inline equations:

```
The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ for any quadratic equation.
```

### **Block Math** (centered, standalone)
Use `$$...$$` or `\[...\]` for block equations:

```
$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
```

## 🧮 **Common Mathematical Examples**

### **Fractions**
```latex
Inline: $\frac{1}{2} + \frac{3}{4} = \frac{5}{4}$
Block: $$\frac{x^2 + 2x + 1}{x + 1} = x + 1$$
```

### **Exponents & Subscripts**
```latex
$x^2 + y^2 = r^2$
$H_2O$ and $CO_2$
$a^{b^c}$ nested exponents
```

### **Square Roots**
```latex
$\sqrt{25} = 5$
$\sqrt[3]{27} = 3$
$\sqrt{x^2 + y^2}$
```

### **Greek Letters**
```latex
$\alpha, \beta, \gamma, \delta$
$\pi, \theta, \phi, \omega$
Uppercase: $\Gamma, \Delta, \Pi, \Omega$
```

### **Trigonometry**
```latex
$\sin(x), \cos(x), \tan(x)$
$\sin^2(x) + \cos^2(x) = 1$
```

### **Calculus**
```latex
Derivatives: $\frac{dx}{dt}, \frac{\partial f}{\partial x}$
Integrals: $\int_{0}^{1} x^2 dx$
Limits: $\lim_{x \to 0} \frac{\sin x}{x} = 1$
```

### **Matrices**
```latex
$$\begin{matrix}
a & b \\
c & d
\end{matrix}$$
```

### **Chemistry**
```latex
$CH_4 + 2O_2 \rightarrow CO_2 + 2H_2O$
$H^+ + OH^- \rightleftharpoons H_2O$
```

### **Physics**
```latex
$E = mc^2$
$F = ma$
$V = IR$ (Ohm's Law)
$$\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}$$
```

## 📚 **Subject-Specific Examples**

### **Mathematics**
**Question**: Solve the equation $x^2 - 5x + 6 = 0$
**Options**:
- $x = 2, x = 3$ ✅
- $x = 1, x = 6$  
- $x = -2, x = -3$
- $x = 0, x = 5$

### **Physics**
**Question**: What's the kinetic energy formula?
**Options**:
- $KE = \frac{1}{2}mv^2$ ✅
- $KE = mgh$
- $KE = \frac{mv^2}{2}$ (same as correct, alternative notation)
- $KE = mv$

### **Chemistry**
**Question**: Balance this equation: $\_\_\_H_2 + \_\_\_O_2 \rightarrow \_\_\_H_2O$
**Answer**: $2H_2 + O_2 \rightarrow 2H_2O$

### **Biology**
**Question**: The photosynthesis equation is:
$$6CO_2 + 6H_2O + \text{light energy} \rightarrow C_6H_{12}O_6 + 6O_2$$

## 🎯 **Challenge Type Examples**

### **Multiple Choice (SELECT)**
```
Question: What is the derivative of $x^3$?

Options:
A) $3x^2$ ✅
B) $x^2$
C) $3x$
D) $\frac{x^4}{4}$
```

### **Match Pairs (MATCH_PAIRS)**
```
Match the function with its derivative:

Left side:          Right side:
$x^2$          ↔    $2x$
$\sin(x)$      ↔    $\cos(x)$
$e^x$          ↔    $e^x$
$\ln(x)$       ↔    $\frac{1}{x}$
```

### **Fill in the Blanks (FILL_BLANK)**
```
Question: The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ where the discriminant is {1} and it determines the number of {2} solutions.

Answers:
{1}: $b^2 - 4ac$
{2}: real
```

### **Sequence (SEQUENCE)**
```
Question: Arrange these mathematical constants in ascending order:

Items to sequence:
1. $\pi \approx 3.14159$
2. $e \approx 2.71828$
3. $\phi = \frac{1 + \sqrt{5}}{2} \approx 1.618$ (Golden ratio)
4. $\sqrt{2} \approx 1.414$

Correct order: $\sqrt{2}$, $\phi$, $e$, $\pi$
```

### **Drag & Drop (DRAG_DROP)**
```
Question: Place the correct mathematical expressions in their respective categories:

Zones:
- Exponential Functions
- Trigonometric Functions
- Logarithmic Functions

Items to drag:
- $e^x$
- $\sin(x)$
- $\ln(x)$
- $2^x$
- $\cos(x)$
- $\log_{10}(x)$
```

## 🔧 **Advanced LaTeX Features**

### **Special Symbols**
```latex
$\infty$ (infinity)
$\neq$ (not equal)
$\leq, \geq$ (less/greater than or equal)
$\approx$ (approximately)
$\pm$ (plus or minus)
$\times, \div$ (multiply, divide)
$\rightarrow, \leftarrow$ (arrows)
$\in, \notin$ (element of, not element of)
$\subset, \supset$ (subset, superset)
```

### **Accents & Decorations**
```latex
$\hat{x}, \bar{x}, \tilde{x}$
$\vec{v}, \overrightarrow{AB}$
$\dot{x}, \ddot{x}$ (derivatives)
```

### **Text in Math Mode**
```latex
$\text{Speed} = \frac{\text{Distance}}{\text{Time}}$
```

## ⚠️ **Best Practices**

### **✅ DO:**
- Test your LaTeX in a preview before saving
- Use consistent notation throughout your course
- Keep expressions readable and not overly complex
- Use `\text{}` for words within math expressions
- Break long equations into multiple lines when needed

### **❌ DON'T:**
- Use extremely complex expressions that might confuse students
- Mix different notation styles in the same course
- Forget to escape special characters when needed
- Use deprecated LaTeX commands

## 🧪 **Testing Your LaTeX**

Before publishing challenges, you can test LaTeX expressions at:
- **KaTeX Demo**: https://katex.org/
- **Online LaTeX Editor**: https://www.codecogs.com/latex/eqneditor.php

## 🎨 **Visual Examples**

The LaTeX math will render beautifully with:
- **Proper typography** matching mathematical conventions
- **Scalable fonts** that work on all devices
- **Consistent styling** across all challenge types
- **Fast rendering** using KaTeX engine

## 📱 **Mobile Compatibility**

All LaTeX expressions are fully responsive and render perfectly on:
- 📱 **Mobile phones**
- 📱 **Tablets**
- 💻 **Desktop computers**
- 🖥️ **Large displays**

---

## 🚀 **Ready to Use!**

Start creating mathematical challenges with beautiful LaTeX rendering across all your courses. This feature is particularly powerful for:

- 🧮 **Mathematics courses** (Algebra, Calculus, Geometry)
- 🔬 **Physics courses** (Mechanics, Electromagnetism, Thermodynamics)
- ⚗️ **Chemistry courses** (Equations, Molecular formulas)
- 📊 **Statistics courses** (Formulas, Distributions)
- 🏗️ **Engineering courses** (Technical formulas)

**Happy teaching with beautiful math! 📐✨** 