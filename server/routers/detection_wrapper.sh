#!/bin/bash
# 绕过虚拟环境，使用系统 Python 3.11 运行检测脚本
unset PYTHONPATH
unset VIRTUAL_ENV
unset PYTHONHOME
exec /usr/bin/python3.11 -B "$@"
