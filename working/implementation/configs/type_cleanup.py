#!/usr/bin/env python3
"""
Type Cleanup and Enhancement Script
Automated type annotation improvement and validation for the Windsurf Ecosystem
"""

import ast
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class TypeIssue:
    """Represents a type-related issue found in code."""

    file_path: Path
    line_number: int
    column: int
    issue_type: str
    description: str
    suggested_fix: str
    confidence: float


@dataclass
class TypeAnalysisResult:
    """Results of type analysis for a file or project."""

    total_functions: int
    typed_functions: int
    total_variables: int
    typed_variables: int
    issues: list[TypeIssue]
    coverage_percentage: float


class TypeAnnotationAnalyzer(ast.NodeVisitor):
    """AST visitor to analyze type annotation coverage and quality."""

    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.issues: list[TypeIssue] = []
        self.functions: list[ast.FunctionDef] = []
        self.variables: list[ast.AnnAssign] = []
        self.imports: set[str] = set()
        self.typing_imports: set[str] = set()

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.imports.add(alias.name)
            if alias.name == "typing":
                self.typing_imports.add("typing")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module == "typing":
            for alias in node.names:
                self.typing_imports.add(alias.name)
        elif node.module and "typing" in node.module:
            for alias in node.names:
                self.typing_imports.add(alias.name)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.functions.append(node)

        # Check for missing return type annotation
        if not node.returns and not self._is_special_method(node.name):
            self.issues.append(
                TypeIssue(
                    file_path=self.file_path,
                    line_number=node.lineno,
                    column=node.col_offset,
                    issue_type="missing_return_type",
                    description=f"Function '{node.name}' missing return type annotation",
                    suggested_fix=self._suggest_return_type(node),
                    confidence=0.8,
                )
            )

        # Check for missing parameter type annotations
        for arg in node.args.args:
            if not arg.annotation and arg.arg != "self":
                self.issues.append(
                    TypeIssue(
                        file_path=self.file_path,
                        line_number=node.lineno,
                        column=node.col_offset,
                        issue_type="missing_param_type",
                        description=f"Parameter '{arg.arg}' in function '{node.name}' missing type annotation",
                        suggested_fix=f"Add type annotation: {arg.arg}: <type>",
                        confidence=0.7,
                    )
                )

        self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign):
        self.variables.append(node)
        self.generic_visit(node)

    def _is_special_method(self, name: str) -> bool:
        """Check if method is a special method that might not need return annotation."""
        special_methods = {
            "__init__",
            "__enter__",
            "__exit__",
            "__del__",
            "__setattr__",
            "__delattr__",
            "__setitem__",
            "__delitem__",
        }
        return name in special_methods

    def _suggest_return_type(self, node: ast.FunctionDef) -> str:
        """Suggest a return type based on function analysis."""
        # Simple heuristics for return type suggestion
        if node.name.startswith("is_") or node.name.startswith("has_"):
            return "-> bool"
        elif node.name.startswith("get_") or node.name.startswith("find_"):
            return "-> Optional[Any]"
        elif node.name.startswith("create_") or node.name.startswith("make_"):
            return "-> Any"
        elif self._has_return_statement(node):
            return "-> Any"
        else:
            return "-> None"

    def _has_return_statement(self, node: ast.FunctionDef) -> bool:
        """Check if function has explicit return statements."""
        for child in ast.walk(node):
            if isinstance(child, ast.Return) and child.value is not None:
                return True
        return False


class ModernTypingConverter:
    """Converts legacy typing syntax to modern Python 3.11+ syntax."""

    LEGACY_TO_MODERN = {
        "typing.List": "list",
        "typing.Dict": "dict",
        "typing.Set": "set",
        "typing.Tuple": "tuple",
        "typing.FrozenSet": "frozenset",
        "typing.Deque": "collections.deque",
        "typing.DefaultDict": "collections.defaultdict",
        "typing.OrderedDict": "collections.OrderedDict",
        "typing.Counter": "collections.Counter",
        "typing.ChainMap": "collections.ChainMap",
        "List": "list",
        "Dict": "dict",
        "Set": "set",
        "Tuple": "tuple",
        "FrozenSet": "frozenset",
    }

    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.conversions_made: list[str] = []

    def convert_file(self) -> bool:
        """Convert legacy typing syntax to modern syntax."""
        if not self.file_path.exists():
            return False

        content = self.file_path.read_text()
        original_content = content

        # Convert typing imports
        content = self._convert_imports(content)

        # Convert type annotations
        content = self._convert_annotations(content)

        if content != original_content:
            self.file_path.write_text(content)
            return True

        return False

    def _convert_imports(self, content: str) -> str:
        """Convert legacy typing imports."""
        lines = content.split("\n")
        new_lines = []

        for line in lines:
            # Remove unnecessary typing imports for built-in types
            if re.match(r"^from typing import.*", line):
                imports = re.findall(r"\b(List|Dict|Set|Tuple|FrozenSet)\b", line)
                if imports:
                    # Remove these imports and add note
                    remaining = line
                    for imp in imports:
                        remaining = re.sub(rf"\b{imp}\b,?\s*", "", remaining)

                    # Clean up the import line
                    remaining = re.sub(r",\s*,", ",", remaining)
                    remaining = re.sub(r"import\s*,", "import", remaining)
                    remaining = re.sub(r",\s*$", "", remaining)

                    if remaining.strip().endswith("import"):
                        # Skip empty import
                        self.conversions_made.append(
                            f"Removed legacy typing imports: {', '.join(imports)}"
                        )
                        continue
                    else:
                        line = remaining

            new_lines.append(line)

        return "\n".join(new_lines)

    def _convert_annotations(self, content: str) -> str:
        """Convert type annotations to modern syntax."""
        for legacy, modern in self.LEGACY_TO_MODERN.items():
            if legacy in content:
                # Use word boundaries to avoid partial matches
                pattern = rf"\b{re.escape(legacy)}\b"
                content = re.sub(pattern, modern, content)
                if legacy in content:  # Check if replacement was made
                    self.conversions_made.append(f"Converted {legacy} to {modern}")

        return content


class TypeCleanupTool:
    """Main tool for type cleanup and enhancement."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.windsurf_dir = project_root / ".windsurf"
        self.insights_file = (
            self.windsurf_dir / "memory" / "type_improvement_insights.md"
        )

    def analyze_project(self, src_dirs: list[str] = None) -> TypeAnalysisResult:
        """Analyze type coverage across the project."""
        if src_dirs is None:
            src_dirs = ["src", "tests"]

        all_issues = []
        total_functions = 0
        typed_functions = 0
        total_variables = 0
        typed_variables = 0

        for src_dir in src_dirs:
            src_path = self.project_root / src_dir
            if not src_path.exists():
                continue

            for py_file in src_path.rglob("*.py"):
                if py_file.name.startswith("__"):
                    continue

                try:
                    analyzer = TypeAnnotationAnalyzer(py_file)
                    tree = ast.parse(py_file.read_text())
                    analyzer.visit(tree)

                    all_issues.extend(analyzer.issues)
                    total_functions += len(analyzer.functions)
                    total_variables += len(analyzer.variables)

                    # Count typed functions
                    for func in analyzer.functions:
                        if func.returns or self._is_special_method(func.name):
                            typed_functions += 1

                    # Count typed variables
                    typed_variables += len(analyzer.variables)

                except Exception as e:
                    print(f"Error analyzing {py_file}: {e}")

        coverage = (
            (typed_functions / total_functions * 100) if total_functions > 0 else 100
        )

        return TypeAnalysisResult(
            total_functions=total_functions,
            typed_functions=typed_functions,
            total_variables=total_variables,
            typed_variables=typed_variables,
            issues=all_issues,
            coverage_percentage=coverage,
        )

    def modernize_typing(self, src_dirs: list[str] = None) -> dict[str, list[str]]:
        """Convert legacy typing syntax to modern Python 3.11+ syntax."""
        if src_dirs is None:
            src_dirs = ["src", "tests"]

        conversion_results = {}

        for src_dir in src_dirs:
            src_path = self.project_root / src_dir
            if not src_path.exists():
                continue

            for py_file in src_path.rglob("*.py"):
                if py_file.name.startswith("__"):
                    continue

                converter = ModernTypingConverter(py_file)
                if converter.convert_file():
                    conversion_results[str(py_file)] = converter.conversions_made

        return conversion_results

    def run_mypy_analysis(self) -> dict[str, Any]:
        """Run MyPy analysis and return structured results."""
        try:
            result = subprocess.run(
                ["mypy", "src/", "--json-report", ".windsurf/performance/mypy_report"],
                capture_output=True,
                text=True,
                cwd=self.project_root,
            )

            # Parse MyPy output
            mypy_issues = []
            for line in result.stdout.split("\n"):
                if ":" in line and ("error:" in line or "warning:" in line):
                    mypy_issues.append(line.strip())

            return {
                "exit_code": result.returncode,
                "issues": mypy_issues,
                "issue_count": len(mypy_issues),
                "status": "passing" if result.returncode == 0 else "failing",
            }

        except Exception as e:
            return {"exit_code": -1, "error": str(e), "status": "error"}

    def generate_improvement_suggestions(
        self, analysis: TypeAnalysisResult
    ) -> list[str]:
        """Generate actionable improvement suggestions."""
        suggestions = []

        if analysis.coverage_percentage < 80:
            suggestions.append(
                f"Type coverage is {analysis.coverage_percentage:.1f}%. "
                f"Focus on adding type annotations to improve coverage."
            )

        # Group issues by type
        issue_counts = {}
        for issue in analysis.issues:
            issue_counts[issue.issue_type] = issue_counts.get(issue.issue_type, 0) + 1

        for issue_type, count in issue_counts.items():
            if issue_type == "missing_return_type":
                suggestions.append(
                    f"Add return type annotations to {count} functions. "
                    f"This will improve code clarity and IDE support."
                )
            elif issue_type == "missing_param_type":
                suggestions.append(
                    f"Add parameter type annotations to {count} parameters. "
                    f"This enables better type checking and documentation."
                )

        if analysis.total_functions > 0:
            typed_ratio = analysis.typed_functions / analysis.total_functions
            if typed_ratio < 0.9:
                suggestions.append(
                    f"Consider adding type annotations to remaining "
                    f"{analysis.total_functions - analysis.typed_functions} functions."
                )

        return suggestions

    def log_insights(self, analysis: TypeAnalysisResult, suggestions: list[str]):
        """Log type improvement insights to the insights file."""
        timestamp = subprocess.run(
            ["date", "+%Y-%m-%d %H:%M:%S"], capture_output=True, text=True
        ).stdout.strip()

        insight_entry = f"""
### {timestamp}: Type Analysis Results

**Coverage Metrics:**
- Function Type Coverage: {analysis.typed_functions}/{analysis.total_functions} ({analysis.coverage_percentage:.1f}%)
- Variable Type Coverage: {analysis.typed_variables}/{analysis.total_variables}
- Total Issues Found: {len(analysis.issues)}

**Issue Breakdown:**
"""

        issue_counts = {}
        for issue in analysis.issues:
            issue_counts[issue.issue_type] = issue_counts.get(issue.issue_type, 0) + 1

        for issue_type, count in issue_counts.items():
            insight_entry += f"- {issue_type.replace('_', ' ').title()}: {count}\n"

        insight_entry += """
**Improvement Suggestions:**
"""
        for suggestion in suggestions:
            insight_entry += f"- {suggestion}\n"

        insight_entry += """
**Action Items:**
- [ ] Address high-confidence type issues
- [ ] Add return type annotations to untyped functions
- [ ] Add parameter type annotations where missing
- [ ] Run MyPy validation after improvements
- [ ] Update type annotation guidelines based on findings

---
"""

        # Ensure insights file exists and append
        self.insights_file.parent.mkdir(parents=True, exist_ok=True)

        if self.insights_file.exists():
            content = self.insights_file.read_text()
        else:
            content = "# Type Improvement Insights\n\n"

        content += insight_entry
        self.insights_file.write_text(content)

    def _is_special_method(self, name: str) -> bool:
        """Check if method is a special method."""
        special_methods = {
            "__init__",
            "__enter__",
            "__exit__",
            "__del__",
            "__setattr__",
            "__delattr__",
            "__setitem__",
            "__delitem__",
        }
        return name in special_methods


def main():
    """Main execution function."""
    project_root = Path.cwd()
    tool = TypeCleanupTool(project_root)

    print("🔒 Windsurf Type Cleanup and Enhancement Tool")
    print("=" * 50)

    # Analyze current type coverage
    print("📊 Analyzing type coverage...")
    analysis = tool.analyze_project()

    print("\n📈 Type Coverage Analysis:")
    print(
        f"  Functions: {analysis.typed_functions}/{analysis.total_functions} ({analysis.coverage_percentage:.1f}%)"
    )
    print(f"  Variables: {analysis.typed_variables}/{analysis.total_variables}")
    print(f"  Issues Found: {len(analysis.issues)}")

    # Modernize typing syntax
    print("\n🔄 Modernizing typing syntax...")
    conversions = tool.modernize_typing()

    if conversions:
        print(f"  Modernized {len(conversions)} files:")
        for file_path, changes in conversions.items():
            print(f"    {Path(file_path).name}: {len(changes)} changes")
    else:
        print("  No legacy typing syntax found")

    # Run MyPy analysis
    print("\n🔍 Running MyPy analysis...")
    mypy_results = tool.run_mypy_analysis()
    print(f"  Status: {mypy_results['status']}")
    print(f"  Issues: {mypy_results.get('issue_count', 0)}")

    # Generate improvement suggestions
    suggestions = tool.generate_improvement_suggestions(analysis)

    if suggestions:
        print("\n💡 Improvement Suggestions:")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"  {i}. {suggestion}")

    # Log insights
    tool.log_insights(analysis, suggestions)
    print(f"\n📝 Insights logged to: {tool.insights_file}")

    # Summary
    print("\n✅ Type cleanup complete!")
    print(f"   Coverage: {analysis.coverage_percentage:.1f}%")
    print(f"   Issues: {len(analysis.issues)}")
    print(f"   Modernizations: {len(conversions)} files")


if __name__ == "__main__":
    main()
